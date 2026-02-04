package middleware

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// BoothAuth verifies the booth_token cookie against activities of type booth.
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

			booth, err := repo.GetActivityByID(r.Context(), tx, cookie.Value)
			if err != nil {
				logger.Error("booth auth: fetch activity failed", zap.Error(err))
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}
			if booth == nil || booth.Type != models.ActivitiesTypeBooth {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			if err := repo.CommitTransaction(r.Context(), tx); err != nil {
				http.Error(w, "Internal error", http.StatusInternalServerError)
				return
			}

			ctx := contextWithBooth(r.Context(), booth)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
