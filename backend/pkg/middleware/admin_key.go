package middleware

import (
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// AdminAuth validates admin_token cookie for admin APIs.
func AdminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("admin_token")
		if err != nil || cookie.Value == "" {
			res.Fail(w, r, http.StatusUnauthorized, errors.New("missing admin session"), "unauthorized")
			return
		}
		if cookie.Value != config.Env().AdminKey {
			res.Fail(w, r, http.StatusUnauthorized, errors.New("invalid admin session"), "unauthorized")
			return
		}

		next.ServeHTTP(w, r)
	})
}
