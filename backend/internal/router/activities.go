package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/activities"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// ActivityRoutes wires activity-related endpoints.
func ActivityRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	h := activities.New(repo, logger)

	r.Route("/booth", func(r chi.Router) {
		r.Post("/session", h.BoothLogin)

		r.Group(func(r chi.Router) {
			r.Use(middleware.BoothAuth(repo, logger))
			r.Post("/user/check-ins", h.BoothCheckIn)
			r.Get("/stats", h.BoothCount)
		})
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(repo, logger))

		// List activities with user's check-in status
		r.Get("/stats", h.List)

		// user scans an activity QR code to check in
		r.Post("/check-ins", h.ActivityCheckIn)
	})

	return r
}
