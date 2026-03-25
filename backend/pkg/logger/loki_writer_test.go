package logger //nolint:testpackage // tests need access to unexported Loki writer internals

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
)

func TestLokiWriterFlushesOnBatchSize(t *testing.T) {
	t.Parallel()

	var (
		mu       sync.Mutex
		payloads []lokiPushRequest
	)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read request body: %v", err)
		}

		var payload lokiPushRequest
		unmarshalErr := json.Unmarshal(body, &payload)
		if unmarshalErr != nil {
			t.Fatalf("decode request payload: %v", unmarshalErr)
		}

		mu.Lock()
		payloads = append(payloads, payload)
		mu.Unlock()

		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	writer := newLokiWriteSyncer(&config.EnvConfig{
		LokiURL:       server.URL,
		LokiService:   "svc",
		LokiEnv:       "test",
		LokiTimeout:   time.Second,
		LokiBatchSize: 2,
		LokiBatchWait: time.Hour,
	}).(*lokiWriter)

	_, _ = writer.Write([]byte(`{"level":"info","msg":"first"}`))
	_, _ = writer.Write([]byte(`{"level":"error","msg":"second"}`))

	requireEventually(t, func() bool {
		mu.Lock()
		defer mu.Unlock()
		return len(payloads) == 1
	})

	mu.Lock()
	defer mu.Unlock()

	if len(payloads) != 1 {
		t.Fatalf("expected 1 payload, got %d", len(payloads))
	}

	streamCount := len(payloads[0].Streams)
	if streamCount != 2 {
		t.Fatalf("expected 2 streams grouped by level, got %d", streamCount)
	}
}

func TestLokiWriterSyncFlushesPendingLogs(t *testing.T) {
	t.Parallel()

	var (
		mu       sync.Mutex
		payloads []lokiPushRequest
	)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read request body: %v", err)
		}

		var payload lokiPushRequest
		unmarshalErr := json.Unmarshal(body, &payload)
		if unmarshalErr != nil {
			t.Fatalf("decode request payload: %v", unmarshalErr)
		}

		mu.Lock()
		payloads = append(payloads, payload)
		mu.Unlock()

		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	writer := newLokiWriteSyncer(&config.EnvConfig{
		LokiURL:       server.URL,
		LokiService:   "svc",
		LokiEnv:       "test",
		LokiTimeout:   time.Second,
		LokiBatchSize: 10,
		LokiBatchWait: time.Hour,
	}).(*lokiWriter)

	_, _ = writer.Write([]byte(`{"level":"info","msg":"first"}`))

	if err := writer.Sync(); err != nil {
		t.Fatalf("sync writer: %v", err)
	}

	mu.Lock()
	defer mu.Unlock()

	if len(payloads) != 1 {
		t.Fatalf("expected 1 payload after sync, got %d", len(payloads))
	}

	if len(payloads[0].Streams) != 1 {
		t.Fatalf("expected 1 stream, got %d", len(payloads[0].Streams))
	}

	if len(payloads[0].Streams[0].Values) != 1 {
		t.Fatalf("expected 1 log entry, got %d", len(payloads[0].Streams[0].Values))
	}
}

func requireEventually(t *testing.T, fn func() bool) {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if fn() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}

	t.Fatal("condition not met before timeout")
}
