package admin

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

type createGiftCouponRequest struct {
	Price      int    `json:"price"`
	DiscountID string `json:"discount_id"`
}

// CreateGiftCoupon handles POST /admin/gift-coupons.
// @Summary      建立 gift coupon
// @Description  需要 admin_token cookie。建立一張 gift coupon（token 可讓使用者兌換折扣券）。
// @Tags         admin
// @Accept       json
// @Produce      json
// @Param        request      body      createGiftCouponRequest  true  "Gift coupon payload"
// @Success      201          {object}  models.DiscountCouponGift
// @Failure      400          {object}  res.ErrorResponse "invalid payload"
// @Failure      401          {object}  res.ErrorResponse "unauthorized"
// @Failure      500          {object}  res.ErrorResponse
// @Router       /admin/gift-coupons [post]
func (h *Handler) CreateGiftCoupon(w http.ResponseWriter, r *http.Request) {
	var req createGiftCouponRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.Price <= 0 || req.DiscountID == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("invalid price or discount_id"), "invalid payload")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	gift, err := h.Repo.CreateDiscountCouponGift(r.Context(), tx, req.Price, req.DiscountID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to create gift coupon")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(gift)
}
