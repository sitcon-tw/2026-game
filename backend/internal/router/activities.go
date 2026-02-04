package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/activities"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// ActivityRoutes wires activity-related endpoints.
func ActivityRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := activities.New(repo, logger)

	// booth scans the user's QR code (booth identified via cookie/session)
	mux.HandleFunc("POST /booth/login", h.BoothLogin)
	mux.Handle("POST /booth/{userQRCode}", middleware.BoothAuth(repo, logger)(http.HandlerFunc(h.BoothCheckIn)))
	mux.Handle("GET /booth/count", middleware.BoothAuth(repo, logger)(http.HandlerFunc(h.BoothCount)))

	// List activities with user's check-in status
	mux.Handle("GET /", middleware.Auth(repo, logger)(http.HandlerFunc(h.List)))

	// user scans an activity QR code to check in
	mux.Handle("POST /{activityQRCode}", middleware.Auth(repo, logger)(http.HandlerFunc(h.ActivityCheckIn)))

	return mux
}
