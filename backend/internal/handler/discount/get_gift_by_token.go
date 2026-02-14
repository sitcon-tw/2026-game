package discount

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type getGiftCouponRequest struct {
	Token string `json:"token"`
}

// GetGiftCouponByToken handles POST /discount-coupons/gifts.
// @Summary      透過 gift token 取得折扣券
// @Description  需要登入 cookie，透過 token 使用 gift 折扣券；使用後會刪除該 token，並存入使用者折扣券。
// @Tags         discount
// @Accept       json
// @Produce      json
// @Param        request  body      getGiftCouponRequest  true  "Gift token"
// @Success      200    {object}  models.DiscountCoupon
// @Failure      400    {object}  res.ErrorResponse "missing token"
// @Failure      401    {object}  res.ErrorResponse "unauthorized"
// @Failure      404    {object}  res.ErrorResponse "gift coupon not found"
// @Failure      500    {object}  res.ErrorResponse
// @Router       /discount-coupons/gifts [post]
func (h *Handler) GetGiftCouponByToken(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	var req getGiftCouponRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.Token == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing token"), "missing token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	gift, err := h.Repo.ConsumeDiscountCouponGiftByToken(r.Context(), tx, req.Token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusNotFound, err, "gift coupon not found")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to consume gift coupon")
		return
	}

	coupon, err := h.Repo.InsertDiscountCouponForUser(
		r.Context(),
		tx,
		user.ID,
		gift.Price,
		gift.DiscountID,
	)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to create user coupon")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(coupon)
}
