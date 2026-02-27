package admin

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type assignCouponRequest struct {
	UserID     string `json:"user_id"`
	Price      int    `json:"price"`
	DiscountID string `json:"discount_id"`
}

// AssignCouponToUser handles POST /admin/gift-coupons/assignments.
// @Summary      直接發放折扣券給使用者
// @Description  需要 admin_token cookie。透過 user_id 直接建立 discount coupon 給該使用者。
// @Tags         admin
// @Accept       json
// @Produce      json
// @Param        request      body      assignCouponRequest  true  "Assign coupon payload"
// @Success      201          {object}  models.DiscountCoupon
// @Failure      400          {object}  res.ErrorResponse "invalid payload"
// @Failure      401          {object}  res.ErrorResponse "unauthorized"
// @Failure      404          {object}  res.ErrorResponse "user not found"
// @Failure      500          {object}  res.ErrorResponse
// @Router       /admin/gift-coupons/assignments [post]
func (h *Handler) AssignCouponToUser(w http.ResponseWriter, r *http.Request) {
	var req assignCouponRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.UserID == "" || req.Price <= 0 || req.DiscountID == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("invalid user_id, price or discount_id"), "invalid payload")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	if _, err = h.Repo.GetUserByID(r.Context(), tx, req.UserID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusNotFound, err, "user not found")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to find user")
		return
	}

	coupon, err := h.Repo.InsertDiscountCouponForUser(r.Context(), tx, req.UserID, req.Price, req.DiscountID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to assign coupon")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(coupon)
}
