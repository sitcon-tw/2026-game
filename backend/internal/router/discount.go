package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/handler/discount"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// DiscountRoutes wires discount-related endpoints.
func DiscountRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()

	h := discount.New(repo, logger)

	// Staff scans attendee's coupon QR code
	r.Post("/{couponToken}", h.DiscountUsed)

	return r
}
