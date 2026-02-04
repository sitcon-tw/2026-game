package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/user"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// UserRoutes wires user-related endpoints.
func UserRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := user.New(repo, logger)

	// The reason we need login is for store user session in cookies.
	mux.HandleFunc("GET /login", h.Login)
	// Get user profile/data
	mux.Handle("GET /me", middleware.Auth(repo, logger)(http.HandlerFunc(h.Me)))

	return mux
}
