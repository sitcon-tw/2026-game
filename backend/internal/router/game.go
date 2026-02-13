package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/game"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// GameRoutes wires game-related endpoints.
func GameRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Auth(repo, logger))

	h := game.New(repo, logger)

	// Submit game to next level
	r.Post("/submissions", h.Submit)
	// Get the users rank in the game
	r.Get("/leaderboards", h.Rank)
	r.Get("/levels/{level}", h.GetLevelInfo)

	return r
}
