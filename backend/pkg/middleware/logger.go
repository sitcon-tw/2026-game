package middleware

import (
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/res"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type wrapperWriter struct {
	http.ResponseWriter

	statusCode int
}

func (w *wrapperWriter) WriteHeader(statusCode int) {
	w.ResponseWriter.WriteHeader(statusCode)
	w.statusCode = statusCode
}

// Logger is a middleware that logs HTTP requests using the provided zap.Logger.
func Logger(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			wrapped := &wrapperWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			r = r.WithContext(res.WithLogger(r.Context(), logger))
			next.ServeHTTP(wrapped, r)

			fields := []zap.Field{
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.Int("status", wrapped.statusCode),
				zap.String("remote_ip", r.RemoteAddr),
				zap.Duration("latency", time.Since(start)),
				zap.String("user_agent", r.UserAgent()),
			}

			spanCtx := trace.SpanContextFromContext(r.Context())
			if spanCtx.IsValid() {
				fields = append(fields,
					zap.String("trace_id", spanCtx.TraceID().String()),
					zap.String("span_id", spanCtx.SpanID().String()),
				)
			}

			logger.Info("http request", fields...)
		})
	}
}
