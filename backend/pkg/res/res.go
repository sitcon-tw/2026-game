package res

import (
	"context"
	"encoding/json"
	"net/http"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type contextKey string

const loggerContextKey contextKey = "requestLogger"

// ErrorResponse is the JSON envelope for error cases.
type ErrorResponse struct {
	Message string `json:"message"`
}

// WithLogger stores logger in request context for response helpers.
func WithLogger(ctx context.Context, logger *zap.Logger) context.Context {
	return context.WithValue(ctx, loggerContextKey, logger)
}

func loggerFromContext(ctx context.Context) *zap.Logger {
	logger, _ := ctx.Value(loggerContextKey).(*zap.Logger)
	return logger
}

func withTraceFields(ctx context.Context, logger *zap.Logger) *zap.Logger {
	if logger == nil {
		return nil
	}

	spanCtx := trace.SpanContextFromContext(ctx)
	if !spanCtx.IsValid() {
		return logger
	}

	return logger.With(
		zap.String("trace_id", spanCtx.TraceID().String()),
		zap.String("span_id", spanCtx.SpanID().String()),
	)
}

// Fail logs the error and returns a JSON error payload with the given status code.
// The message is returned to the client; the error is only logged.
func Fail(w http.ResponseWriter, r *http.Request, status int, err error, message string) {
	logger := withTraceFields(r.Context(), loggerFromContext(r.Context()))

	if logger != nil && status >= 500 {
		logger.Error("request failed",
			zap.Int("status", status),
			zap.String("message", message),
			zap.Error(err),
		)
	}

	if logger != nil && status >= 400 && status < 500 {
		logger.Warn("client error",
			zap.Int("status", status),
			zap.String("message", message),
			zap.Error(err),
		)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(ErrorResponse{Message: message})
}
