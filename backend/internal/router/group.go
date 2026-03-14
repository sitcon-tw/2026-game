package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/group"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// GroupRoutes wires group-related endpoints.
func GroupRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Auth(repo, logger))

	h := group.New(repo, logger)

	// List all members in the current user's group with check-in status
	r.Get("/members", h.ListMembers)
	// Scan a group member's one-time QR to bidirectionally check in
	r.Post("/check-ins", h.CheckIn)

	return r
}
