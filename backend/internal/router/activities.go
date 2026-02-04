package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/activities"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// ActivityRoutes wires activity-related endpoints.
func ActivityRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := activities.New(repo, logger)

	// List activities with user's check-in status
	mux.HandleFunc("GET /", h.List)

	// Case 1: booth scans the user's QR code (booth identified via cookie/session)
	mux.HandleFunc("POST /booth/{userQRCode}", h.BoothCheckIn)
	// Case 2: user scans an activity QR code to check in
	mux.HandleFunc("POST /{activityQRCode}", h.ActivityCheckIn)

	return mux
}
