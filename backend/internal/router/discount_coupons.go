package router

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/handler/discount"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// DiscountCouponsRoutes wires disount coupons endpoints.
func DiscountCouponsRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	mux := http.NewServeMux()

	h := discount.New(repo, logger)

	// Submit game to next level
	mux.HandleFunc("POST /{couponToken}", h.DiscountUsed)

	return mux
}
