package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/friend"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// FriendRoutes wires friend-related endpoints.
func FriendRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Auth(repo, logger))

	h := friend.New(repo, logger)

	// Friend count for the current user
	r.Get("/count", h.Count)
	// Add a friend by scanning their QR code
	r.Post("/", h.AddByQRCode)

	return r
}
