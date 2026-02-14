package discount

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type discountUsedRequest struct {
	UserCouponToken string `json:"user_coupon_token"`
}

// DiscountUsed handles POST /discount-coupons/staff/redemptions.
// @Summary      工作人員掃 QR Code 來使用折扣券
// @Description  用 QR Code 掃描器掃會眾的折價券，然後折價券就會被標記為已使用，同時返回這個折價券的詳細資訊。需已登入並持有 staff_token cookie。
// @Tags         discount
// @Accept       json
// @Produce      json
// @Param        request  body      discountUsedRequest  true  "Discount coupon token"
// @Success      200  {object}  discountUsedResponse  ""
// @Failure      500  {object}  res.ErrorResponse
// @Failure      400  {object}  res.ErrorResponse "missing token | invalid coupon"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Router       /discount-coupons/staff/redemptions [post]
// @Param        Authorization  header  string  false  "Bearer {token} (deprecated; use staff_token cookie)"
//
//nolint:funlen // handler orchestration, keep logic linear
func (h *Handler) DiscountUsed(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	var req discountUsedRequest
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

	// Lock and gather all unused coupons for this user; they must be redeemed as a batch.
	coupons, err := h.Repo.ListUnusedDiscountsByUser(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list coupons")
		return
	}
	if len(coupons) == 0 {
		res.Fail(w, r, http.StatusBadRequest, errors.New("no available coupons"), "no available coupons")
		return
	}

	total := 0
	for _, c := range coupons {
		total += c.Price
	}

	usedAt := time.Now().UTC()
	history := &models.CouponHistory{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		StaffID:   staff.ID,
		Total:     total,
		UsedAt:    usedAt,
		CreatedAt: usedAt,
	}

	err = h.Repo.InsertCouponHistory(r.Context(), tx, history)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to insert coupon history")
		return
	}

	updatedCoupons, err := h.Repo.MarkDiscountsUsedByUser(r.Context(), tx, user.ID, staff.ID, history.ID, usedAt)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusBadRequest, errors.New("no available coupons"), "no available coupons")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to mark coupons used")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := discountUsedResponse{
		UserID:      user.ID,
		UserName:    user.Nickname,
		CouponToken: user.CouponToken,
		Total:       total,
		Count:       len(updatedCoupons),
		UsedBy:      staff.Name,
		UsedAt:      usedAt,
		Coupons:     make([]couponItem, 0, len(updatedCoupons)),
	}

	for _, c := range updatedCoupons {
		resp.Coupons = append(resp.Coupons, couponItem{
			ID:         c.ID,
			DiscountID: c.DiscountID,
			Price:      c.Price,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

// discountUsedResponse is returned after marking all of a user's coupons as used.
type discountUsedResponse struct {
	UserID      string       `json:"user_id"`
	UserName    string       `json:"user_name"`
	CouponToken string       `json:"coupon_token"`
	Total       int          `json:"total"`
	Count       int          `json:"count"`
	UsedBy      string       `json:"used_by"`
	UsedAt      time.Time    `json:"used_at"`
	Coupons     []couponItem `json:"coupons"`
}

type couponItem struct {
	ID         string `json:"id"`
	DiscountID string `json:"discount_id"`
	Price      int    `json:"price"`
}
