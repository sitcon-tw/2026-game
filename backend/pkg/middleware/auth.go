package middleware

import (
	"context"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

type contextKey string

const userContextKey contextKey = "authUser"
const boothContextKey contextKey = "boothActivity"

// Auth verifies the token cookie against the users table.
// On success, it injects the *models.User into request context under userContextKey.
func Auth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("token")
			if err != nil || cookie.Value == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tx, err := repo.StartTransaction(r.Context())
			if err != nil {
				logger.Error("auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(r.Context(), tx)

			user, err := repo.GetUserByID(r.Context(), tx, cookie.Value)
			if err != nil {
				logger.Error("auth: fetch user failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if user == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			if err := repo.CommitTransaction(r.Context(), tx); err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			ctx := r.Context()
			ctx = contextWithUser(ctx, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserFromContext retrieves the authenticated user set by Auth middleware.
func UserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(userContextKey).(*models.User)
	return user, ok
}

func contextWithUser(ctx context.Context, user *models.User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

// BoothFromContext retrieves the authenticated booth activity set by BoothAuth middleware.
func BoothFromContext(ctx context.Context) (*models.Activities, bool) {
	booth, ok := ctx.Value(boothContextKey).(*models.Activities)
	return booth, ok
}

func contextWithBooth(ctx context.Context, booth *models.Activities) context.Context {
	return context.WithValue(ctx, boothContextKey, booth)
}
