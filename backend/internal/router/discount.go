package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/discount"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// DiscountRoutes wires discount-related endpoints.
func DiscountRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	h := discount.New(repo, logger)

	r.Route("/staff", func(r chi.Router) {
		r.Post("/session", h.StaffLogin)

		r.Group(func(r chi.Router) {
			r.Use(middleware.StaffAuth(repo, logger))

			// Staff scans attendee's coupon QR code
			r.Post("/redemptions", h.DiscountUsed)
			// Staff previews user's available coupons
			r.Post("/coupon-tokens/query", h.GetUserCoupons)
			// Staff sees their own redemption history
			r.Get("/current/redemptions", h.ListStaffHistory)
		})
	})

	// Get the count of discounts used by the user
	r.With(middleware.Auth(repo, logger)).Get("/", h.GetDiscount)
	return r
}
