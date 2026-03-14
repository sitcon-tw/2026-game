package helpers

import (
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
)

// NewCookie builds a cookie with consistent defaults.
// In dev, it applies the configured CookieDomain to ease local cross-origin calls.
func NewCookie(name, value string, ttl time.Duration) *http.Cookie {
	cfg := config.Env()

	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   cfg.AppEnv == config.AppEnvProd,
		Expires:  time.Now().Add(ttl),
	}

	return cookie
}
