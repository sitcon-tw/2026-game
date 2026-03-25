package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap/zapcore"
)

const lokiContentType = "application/json"

type lokiWriter struct {
	client    *http.Client
	url       string
	service   string
	env       string
	batchSize int
	batchWait time.Duration
	flushCh   chan struct{}

	mu              sync.Mutex
	buffer          []lokiEntry
	lastErrorReport time.Time
}

type lokiEntry struct {
	timestamp string
	level     string
	line      string
}

type lokiPushRequest struct {
	Streams []lokiStream `json:"streams"`
}

type lokiStream struct {
	Stream map[string]string `json:"stream"`
	Values [][2]string       `json:"values"`
}

type lokiLogLine struct {
	Level string `json:"level"`
}

func newLokiWriteSyncer(cfg *config.EnvConfig) zapcore.WriteSyncer {
	w := &lokiWriter{
		client:    &http.Client{Timeout: cfg.LokiTimeout},
		url:       cfg.LokiURL,
		service:   cfg.LokiService,
		env:       cfg.LokiEnv,
		batchSize: cfg.LokiBatchSize,
		batchWait: cfg.LokiBatchWait,
		flushCh:   make(chan struct{}, 1),
	}

	go w.run()

	return w
}

func (w *lokiWriter) Write(p []byte) (int, error) {
	trimmed := bytes.TrimSpace(p)
	if len(trimmed) == 0 {
		return len(p), nil
	}

	entry := lokiEntry{
		timestamp: strconvFormatInt(time.Now().UnixNano()),
		level:     parseLokiLevel(trimmed),
		line:      string(trimmed),
	}

	w.mu.Lock()
	w.buffer = append(w.buffer, entry)
	shouldFlush := len(w.buffer) >= w.batchSize
	w.mu.Unlock()

	if shouldFlush {
		w.notifyFlush()
	}

	return len(p), nil
}

func (w *lokiWriter) Sync() error {
	w.flush()
	return nil
}

func (w *lokiWriter) run() {
	ticker := time.NewTicker(w.batchWait)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.flush()
		case <-w.flushCh:
			w.flush()
		}
	}
}

func (w *lokiWriter) notifyFlush() {
	select {
	case w.flushCh <- struct{}{}:
	default:
	}
}

func (w *lokiWriter) flush() {
	w.mu.Lock()
	if len(w.buffer) == 0 {
		w.mu.Unlock()
		return
	}
	entries := append([]lokiEntry(nil), w.buffer...)
	w.buffer = nil
	w.mu.Unlock()

	if err := w.push(entries); err != nil {
		w.reportError("push log", err)
	}
}

func (w *lokiWriter) push(entries []lokiEntry) error {
	streamsByLevel := make(map[string][][2]string, len(entries))
	for _, entry := range entries {
		streamsByLevel[entry.level] = append(streamsByLevel[entry.level], [2]string{entry.timestamp, entry.line})
	}

	streams := make([]lokiStream, 0, len(streamsByLevel))
	for level, values := range streamsByLevel {
		streams = append(streams, lokiStream{
			Stream: map[string]string{
				"service": w.service,
				"env":     w.env,
				"level":   level,
			},
			Values: values,
		})
	}

	payload, err := json.Marshal(lokiPushRequest{Streams: streams})
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), w.client.Timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, w.url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", lokiContentType)

	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("unexpected status %s", resp.Status)
	}

	return nil
}

func (w *lokiWriter) reportError(action string, err error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if time.Since(w.lastErrorReport) < 30*time.Second {
		return
	}
	w.lastErrorReport = time.Now()

	_, _ = fmt.Fprintf(os.Stderr, "loki writer failed to %s: %v\n", action, err)
}

func parseLokiLevel(line []byte) string {
	parsed := lokiLogLine{}
	if err := json.Unmarshal(line, &parsed); err != nil {
		return "unknown"
	}
	if parsed.Level == "" {
		return "unknown"
	}
	return strings.ToLower(parsed.Level)
}

func strconvFormatInt(v int64) string {
	return strconv.FormatInt(v, 10)
}
