package middleware

import (
	"context"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"go.uber.org/zap"
)

type contextKey string

const userContextKey contextKey = "authUser"
const boothContextKey contextKey = "boothActivity"
const staffContextKey contextKey = "staffUser"

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

			user, err := repo.GetUserByToken(r.Context(), tx, cookie.Value)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				logger.Error("auth: fetch user failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if user == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(r.Context(), tx)
			if err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			ctx := r.Context()
			ctx = contextWithUser(ctx, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// StaffAuth verifies the Authorization bearer token against the staff table.
// On success, it injects the *models.Staff into request context under staffContextKey.
func StaffAuth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := helpers.BearerToken(r.Header.Get("Authorization"))
			if token == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tx, err := repo.StartTransaction(r.Context())
			if err != nil {
				logger.Error("staff auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(r.Context(), tx)

			staff, err := repo.GetStaffByToken(r.Context(), tx, token)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				logger.Error("staff auth: fetch staff failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if staff == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(r.Context(), tx)
			if err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			ctx := contextWithStaff(r.Context(), staff)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// BoothAuth verifies the booth_token cookie against activities of type booth.
//
//nolint:gocognit // multiple early exits keep middleware readable
func BoothAuth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("booth_token")
			if err != nil || cookie.Value == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tx, err := repo.StartTransaction(r.Context())
			if err != nil {
				logger.Error("booth auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(r.Context(), tx)

			booth, err := repo.GetActivityByToken(r.Context(), tx, cookie.Value)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				logger.Error("booth auth: fetch activity failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if booth == nil || booth.Type != models.ActivitiesTypeBooth {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(r.Context(), tx)
			if err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			ctx := contextWithBooth(r.Context(), booth)
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

// StaffFromContext retrieves authenticated staff set by StaffAuth middleware.
func StaffFromContext(ctx context.Context) (*models.Staff, bool) {
	staff, ok := ctx.Value(staffContextKey).(*models.Staff)
	return staff, ok
}

func contextWithStaff(ctx context.Context, staff *models.Staff) context.Context {
	return context.WithValue(ctx, staffContextKey, staff)
}
