package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/game"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// GameRoutes wires game-related endpoints.
func GameRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := game.New(repo, logger)

	// Submit game to next level
	mux.HandleFunc("POST /", h.Submit)
	// Get the users rank in the game
	mux.HandleFunc("GET /rank", h.Rank)

	return mux
}
