package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/friend"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// FriendRoutes wires friend-related endpoints.
func FriendRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := friend.New(repo, logger)

	// Friend count for the current user
	mux.HandleFunc("GET /count", h.Count)
	// Add a friend by scanning their QR code
	mux.HandleFunc("POST /{userQRCode}", h.AddByQRCode)

	return mux
}
