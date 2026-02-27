package admin

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// DeleteGiftCoupon handles DELETE /admin/gift-coupons/{id}.
// @Summary      刪除 gift coupon
// @Description  需要 admin_token cookie。依 gift coupon id 刪除。
// @Tags         admin
// @Produce      json
// @Param        id           path      string  true  "Gift coupon ID (UUID)"
// @Success      204
// @Failure      400  {object}  res.ErrorResponse "missing id"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      404  {object}  res.ErrorResponse "gift coupon not found"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /admin/gift-coupons/{id} [delete]
func (h *Handler) DeleteGiftCoupon(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing id"), "missing id")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	if err = h.Repo.DeleteDiscountCouponGiftByID(r.Context(), tx, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusNotFound, err, "gift coupon not found")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to delete gift coupon")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
