package discount

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// GetDiscount handles GET /discount.
// Returns all coupons owned by the authenticated user with usage summary.
// @Summary      取得自己的折扣券
// @Description  需要登入 cookie，回傳自己名下的折扣券清單與使用狀態
// @Tags         discount
// @Produce      json
// @Success      200  {object}  []models.DiscountCoupon
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount [get]
func (h *Handler) GetDiscount(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	coupons, err := h.Repo.ListDiscountsByUser(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to list coupons")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(coupons)
}