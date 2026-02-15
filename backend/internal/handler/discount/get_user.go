package discount

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type getUserCouponsRequest struct {
	UserCouponToken string `json:"user_coupon_token"`
}

// GetUserCoupons handles POST /discount-coupons/staff/coupon-tokens/query.
// Staff uses user's coupon token to inspect available coupons and total value.
// @Summary      工作人員查詢某使用者可用折扣券
// @Description  需要 staff_token cookie，帶 userCouponToken 查詢該使用者尚未使用的折扣券與總額
// @Tags         discount
// @Accept       json
// @Produce      json
// @Param        request  body      getUserCouponsRequest  true  "User coupon token"
// @Success      200  {object}  getUserCouponsResponse  ""
// @Failure      400  {object}  res.ErrorResponse "missing token | invalid coupon token"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount-coupons/staff/coupon-tokens/query [post]
// @Param        Authorization  header  string  false  "Bearer {token} (deprecated; use staff_token cookie)"
func (h *Handler) GetUserCoupons(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	var req getUserCouponsRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.UserCouponToken == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing coupon token"), "missing coupon token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, err := h.Repo.GetUserByCouponToken(r.Context(), tx, req.UserCouponToken)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusBadRequest, errors.New("invalid coupon token"), "invalid coupon token")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to fetch user")
		return
	}

	coupons, err := h.Repo.ListUnusedDiscountsByUser(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list coupons")
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
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
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
