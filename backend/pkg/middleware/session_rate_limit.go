package middleware

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/httprate"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// NewSessionRateLimit builds a rate limit middleware keyed by authenticated session identity.
func NewSessionRateLimit() func(http.Handler) http.Handler {
	return httprate.NewRateLimiter(
		config.Env().RateLimitRequestsPerWindow,
		config.Env().RateLimitWindow,
		httprate.WithKeyFuncs(sessionRateLimitKey),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			res.Fail(w, r, http.StatusTooManyRequests, errors.New("rate limit exceeded"), "rate limit exceeded")
		}),
		httprate.WithErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
			res.Fail(w, r, http.StatusInternalServerError, err, "failed to apply rate limit")
		}),
	).Handler
}

func sessionRateLimitKey(r *http.Request) (string, error) {
	if user, ok := UserFromContext(r.Context()); ok && user != nil {
		return fmt.Sprintf("user:%s", user.ID), nil
	}

	if staff, ok := StaffFromContext(r.Context()); ok && staff != nil {
		return fmt.Sprintf("staff:%s", staff.ID), nil
	}

	if booth, ok := BoothFromContext(r.Context()); ok && booth != nil {
		return fmt.Sprintf("booth:%s", booth.ID), nil
	}

	if AdminFromContext(r.Context()) {
		return "admin", nil
	}

	return "", errors.New("missing authenticated session for rate limit")
}
