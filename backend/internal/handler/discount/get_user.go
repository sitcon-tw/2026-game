package discount

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// GetUserCoupons handles GET /discount-coupons/staff/coupon-tokens/{userCouponToken}.
// Staff uses user's coupon token to inspect available coupons and total value.
// @Summary      工作人員查詢某使用者可用折扣券
// @Description  需要 staff_token cookie，帶 userCouponToken 查詢該使用者尚未使用的折扣券與總額
// @Tags         discount
// @Produce      json
// @Param        userCouponToken  path      string  true  "User coupon token"
// @Success      200  {object}  getUserCouponsResponse  ""
// @Failure      400  {object}  res.ErrorResponse "missing token | invalid coupon token"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount-coupons/staff/coupon-tokens/{userCouponToken} [get]
// @Param        Authorization  header  string  false  "Bearer {token} (deprecated; use staff_token cookie)"
func (h *Handler) GetUserCoupons(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	userCouponToken := chi.URLParam(r, "userCouponToken")
	if userCouponToken == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing coupon token"), "missing coupon token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, err := h.Repo.GetUserByCouponToken(r.Context(), tx, userCouponToken)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("invalid coupon token"), "invalid coupon token")
			return
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch user")
		return
	}

	coupons, err := h.Repo.ListUnusedDiscountsByUser(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to list coupons")
		return
	}

	total := 0
	resp := getUserCouponsResponse{
		Coupons: make([]couponItem, 0, len(coupons)),
	}

	for _, c := range coupons {
		total += c.Price
		resp.Coupons = append(resp.Coupons, couponItem{
			ID:         c.ID,
			DiscountID: c.DiscountID,
			Price:      c.Price,
		})
	}
	resp.Total = total

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

type getUserCouponsResponse struct {
	Coupons []couponItem `json:"coupons"`
	Total   int          `json:"total"`
}
