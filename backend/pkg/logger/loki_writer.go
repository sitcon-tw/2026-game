package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap/zapcore"
)

const lokiContentType = "application/json"

type lokiWriter struct {
	client  *http.Client
	url     string
	service string
	env     string

	mu              sync.Mutex
	lastErrorReport time.Time
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
	return &lokiWriter{
		client:  &http.Client{Timeout: cfg.LokiTimeout},
		url:     cfg.LokiURL,
		service: cfg.LokiService,
		env:     cfg.LokiEnv,
	}
}

func (w *lokiWriter) Write(p []byte) (int, error) {
	trimmed := bytes.TrimSpace(p)
	if len(trimmed) == 0 {
		return len(p), nil
	}

	level := parseLokiLevel(trimmed)
	payload, err := json.Marshal(lokiPushRequest{
		Streams: []lokiStream{{
			Stream: map[string]string{
				"service": w.service,
				"env":     w.env,
				"level":   level,
			},
			Values: [][2]string{{strconvFormatInt(time.Now().UnixNano()), string(trimmed)}},
		}},
	})
	if err != nil {
		w.reportError("marshal payload", err)
		return len(p), nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), w.client.Timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, w.url, bytes.NewReader(payload))
	if err != nil {
		w.reportError("build request", err)
		return len(p), nil
	}
	req.Header.Set("Content-Type", lokiContentType)

	resp, err := w.client.Do(req)
	if err != nil {
		w.reportError("push log", err)
		return len(p), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		w.reportError("push log", fmt.Errorf("unexpected status %s", resp.Status))
	}

	return len(p), nil
}

func (w *lokiWriter) Sync() error {
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
	return fmt.Sprintf("%d", v)
}
