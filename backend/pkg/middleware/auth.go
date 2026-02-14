package middleware

import (
	"context"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.uber.org/zap"
)

type contextKey string

const userContextKey contextKey = "authUser"
const boothContextKey contextKey = "boothActivity"
const staffContextKey contextKey = "staffUser"

// Auth verifies the token cookie against the users table.
// On success, it injects the *models.User into request context under userContextKey.
func Auth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	authTracer := otel.Tracer("github.com/sitcon-tw/2026-game/auth")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "auth.user")
			defer span.End()

			cookie, err := r.Cookie("token")
			if err != nil || cookie.Value == "" {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tx, err := repo.StartTransaction(ctx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "start tx failed")
				logger.Error("auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(ctx, tx)

			user, err := repo.GetUserByToken(ctx, tx, cookie.Value)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					span.SetAttributes(attribute.Bool("auth.authenticated", false))
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				span.RecordError(err)
				span.SetStatus(codes.Error, "fetch user failed")
				logger.Error("auth: fetch user failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if user == nil {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(ctx, tx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "commit tx failed")
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			span.SetAttributes(
				attribute.Bool("auth.authenticated", true),
				attribute.String("auth.user_id", user.ID),
			)
			ctx = contextWithUser(ctx, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// StaffAuth verifies the staff_token cookie against the staff table.
// On success, it injects the *models.Staff into request context under staffContextKey.
func StaffAuth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	authTracer := otel.Tracer("github.com/sitcon-tw/2026-game/auth")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "auth.staff")
			defer span.End()

			cookie, err := r.Cookie("staff_token")
			if err != nil || cookie.Value == "" {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			token := cookie.Value

			tx, err := repo.StartTransaction(ctx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "start tx failed")
				logger.Error("staff auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(ctx, tx)

			staff, err := repo.GetStaffByToken(ctx, tx, token)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					span.SetAttributes(attribute.Bool("auth.authenticated", false))
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				span.RecordError(err)
				span.SetStatus(codes.Error, "fetch staff failed")
				logger.Error("staff auth: fetch staff failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if staff == nil {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(ctx, tx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "commit tx failed")
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			span.SetAttributes(
				attribute.Bool("auth.authenticated", true),
				attribute.String("auth.staff_id", staff.ID),
			)
			ctx = contextWithStaff(ctx, staff)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// BoothAuth verifies the booth_token cookie against activities of type booth.
//
//nolint:gocognit // multiple early exits keep middleware readable
func BoothAuth(repo repository.Repository, logger *zap.Logger) func(http.Handler) http.Handler {
	authTracer := otel.Tracer("github.com/sitcon-tw/2026-game/auth")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "auth.booth")
			defer span.End()

			cookie, err := r.Cookie("booth_token")
			if err != nil || cookie.Value == "" {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tx, err := repo.StartTransaction(ctx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "start tx failed")
				logger.Error("booth auth: start tx failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			defer repo.DeferRollback(ctx, tx)

			booth, err := repo.GetActivityByToken(ctx, tx, cookie.Value)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					span.SetAttributes(attribute.Bool("auth.authenticated", false))
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				span.RecordError(err)
				span.SetStatus(codes.Error, "fetch booth failed")
				logger.Error("booth auth: fetch activity failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if booth == nil || booth.Type != models.ActivitiesTypeBooth {
				span.SetAttributes(attribute.Bool("auth.authenticated", false))
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			err = repo.CommitTransaction(ctx, tx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, "commit tx failed")
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			span.SetAttributes(
				attribute.Bool("auth.authenticated", true),
				attribute.String("auth.activity_id", booth.ID),
			)
			ctx = contextWithBooth(ctx, booth)
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
