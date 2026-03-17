package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	users "github.com/sitcon-tw/2026-game/internal/handler/user"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// UserRoutes wires user-related endpoints.
func UserRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	h := users.New(repo, logger)

	// The reason we need login is for store user session in cookies.
	r.Post("/session", h.Login)
	// Get user profile/data
	r.With(middleware.Auth(repo, logger)).Get("/me", h.Me)
	// Update user public namecard data
	r.With(middleware.Auth(repo, logger)).Patch("/me/namecard", h.UpdateNamecard)
	// Get short-lived one-time token for friend QR scan
	r.With(middleware.Auth(repo, logger)).Get("/me/one-time-qr", h.OneTimeQR)

	return r
}
