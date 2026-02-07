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

	// Staff scans attendee's coupon QR code

	r.With(middleware.StaffAuth(repo, logger)).Post("/{couponToken}", h.DiscountUsed)
	// Staff previews user's available coupons
	r.With(middleware.StaffAuth(repo, logger)).Get("/user/{couponToken}", h.GetUserCoupons)
	// Staff sees their own redemption history
	r.With(middleware.StaffAuth(repo, logger)).Get("/history", h.ListStaffHistory)

	// Get the count of discounts used by the user
	r.With(middleware.Auth(repo, logger)).Get("/", h.GetDiscount)
	return r
}
