package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/admin"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// AdminRoutes wires admin-only endpoints.
func AdminRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()
	h := admin.New(repo, logger)

	r.Post("/session", h.Login)

	r.Group(func(r chi.Router) {
		r.Use(middleware.AdminAuth)
		r.Use(middleware.SessionRateLimit())

		r.Post("/gift-coupons", h.CreateGiftCoupon)
		r.Delete("/gift-coupons/{id}", h.DeleteGiftCoupon)
		r.Get("/gift-coupons", h.ListGiftCoupons)
		// Legacy alias: kept for backward compatibility.
		r.Post("/gift-coupons/assignments", h.AssignCouponToUser)
		r.Post("/discount-coupons/assignments", h.AssignCouponToUser)
		r.Get("/users", h.SearchUsers)
	})

	return r
}
