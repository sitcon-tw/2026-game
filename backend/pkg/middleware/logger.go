package middleware

import (
	"net/http"
	"time"

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

			next.ServeHTTP(wrapped, r)

			logger.Info("http request",
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.Int("status", wrapped.statusCode),
				zap.String("remote_ip", r.RemoteAddr),
				zap.Duration("latency", time.Since(start)),
				zap.String("user_agent", r.UserAgent()),
			)
		})
	}
}
