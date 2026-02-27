package admin

import (
	"encoding/json"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// ListGiftCoupons handles GET /admin/gift-coupons.
// @Summary      列出 gift coupons
// @Description  需要 admin_token cookie。列出所有 gift coupons。
// @Tags         admin
// @Produce      json
// @Success      200  {array}   models.DiscountCouponGift
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /admin/gift-coupons [get]
func (h *Handler) ListGiftCoupons(w http.ResponseWriter, r *http.Request) {
	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	gifts, err := h.Repo.ListDiscountCouponGifts(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list gift coupons")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(gifts)
}
