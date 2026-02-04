package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/discount"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// DiscountRoutes wires discount-related endpoints.
func DiscountRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := discount.New(repo, logger)

	// Staff scans attendee's coupon QR code
	mux.HandleFunc("POST /{couponToken}", h.DiscountUsed)

	return mux
}
