package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/announcements"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// AnnouncementRoutes wires announcement-related endpoints.
func AnnouncementRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	h := announcements.New(repo, logger)
	r.Get("/", h.List)

	return r
}
