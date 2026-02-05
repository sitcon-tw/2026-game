package res

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

// ErrorResponse is the JSON envelope for error cases.
type ErrorResponse struct {
	Message string `json:"message"`
}

// Fail logs the error and returns a JSON error payload with the given status code.
// The message is returned to the client; the error is only logged.
func Fail(w http.ResponseWriter, logger *zap.Logger, status int, err error, message string) {
	if logger != nil && err != nil && status >= 500 {
		logger.Error("request failed",
			zap.Int("status", status),
			zap.Error(err),
		)
	}

	if logger != nil && err != nil && status >= 400 && status < 500  {
		logger.Warn("client error",
			zap.Int("status", status),
			zap.Error(err),
		)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(ErrorResponse{Message: message})
}
