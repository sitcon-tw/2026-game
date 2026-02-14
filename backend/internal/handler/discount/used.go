package discount

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

type discountUsedRequest struct {
	UserCouponToken string `json:"user_coupon_token"`
}

var (
	errInvalidCouponToken = errors.New("invalid coupon token")
	errNoAvailableCoupons = errors.New("no available coupons")
)

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
func (h *Handler) DiscountUsed(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	req, err := parseDiscountUsedRequest(r)
	if err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, _, total, err := h.loadUserAndCoupons(r.Context(), tx, req.UserCouponToken)
	if err != nil {
		if errors.Is(err, errInvalidCouponToken) {
			res.Fail(w, r, http.StatusBadRequest, err, "invalid coupon token")
			return
		}
		if errors.Is(err, errNoAvailableCoupons) {
			res.Fail(w, r, http.StatusBadRequest, err, "no available coupons")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to load coupon context")
		return
	}

	usedAt := time.Now().UTC()
	history, err := h.createCouponHistory(r.Context(), tx, user.ID, staff.ID, total, usedAt)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to insert coupon history")
		return
	}

	updatedCoupons, err := h.markCouponsUsed(r.Context(), tx, user.ID, staff.ID, history.ID, usedAt)
	if err != nil {
		if errors.Is(err, errNoAvailableCoupons) {
			res.Fail(w, r, http.StatusBadRequest, err, "no available coupons")
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

	resp := buildDiscountUsedResponse(user, staff, updatedCoupons, total, usedAt)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func parseDiscountUsedRequest(r *http.Request) (discountUsedRequest, error) {
	var req discountUsedRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		return discountUsedRequest{}, err
	}
	if req.UserCouponToken == "" {
		return discountUsedRequest{}, errors.New("missing coupon token")
	}

	return req, nil
}

func (h *Handler) loadUserAndCoupons(
	ctx context.Context,
	tx pgx.Tx,
	userCouponToken string,
) (*models.User, []models.DiscountCoupon, int, error) {
	user, err := h.Repo.GetUserByCouponToken(ctx, tx, userCouponToken)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, nil, 0, errInvalidCouponToken
		}
		return nil, nil, 0, err
	}

	loadCtx, loadSpan := h.tracer.Start(ctx, "discount.redeem.load_unused")
	defer loadSpan.End()

	coupons, err := h.Repo.ListUnusedDiscountsByUser(loadCtx, tx, user.ID)
	if err != nil {
		loadSpan.RecordError(err)
		loadSpan.SetStatus(codes.Error, "list unused coupons failed")
		return nil, nil, 0, err
	}

	loadSpan.SetAttributes(attribute.Int("discount.coupons.count", len(coupons)))
	if len(coupons) == 0 {
		return nil, nil, 0, errNoAvailableCoupons
	}

	total := 0
	for _, c := range coupons {
		total += c.Price
	}

	return user, coupons, total, nil
}

func (h *Handler) createCouponHistory(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	staffID string,
	total int,
	usedAt time.Time,
) (*models.CouponHistory, error) {
	historyCtx, historySpan := h.tracer.Start(ctx, "discount.redeem.build_history")
	defer historySpan.End()

	history := &models.CouponHistory{
		UserID:    userID,
		StaffID:   staffID,
		ID:        uuid.NewString(),
		Total:     total,
		UsedAt:    usedAt,
		CreatedAt: usedAt,
	}

	err := h.Repo.InsertCouponHistory(historyCtx, tx, history)
	if err != nil {
		historySpan.RecordError(err)
		historySpan.SetStatus(codes.Error, "insert coupon history failed")
		return nil, err
	}
	historySpan.SetAttributes(attribute.Int("discount.total", total))

	return history, nil
}

func (h *Handler) markCouponsUsed(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	staffID string,
	historyID string,
	usedAt time.Time,
) ([]models.DiscountCoupon, error) {
	markCtx, markSpan := h.tracer.Start(ctx, "discount.redeem.mark_used")
	defer markSpan.End()

	updatedCoupons, err := h.Repo.MarkDiscountsUsedByUser(markCtx, tx, userID, staffID, historyID, usedAt)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			markSpan.SetStatus(codes.Error, "no coupons to mark")
			return nil, errNoAvailableCoupons
		}
		markSpan.RecordError(err)
		markSpan.SetStatus(codes.Error, "mark coupons used failed")
		return nil, err
	}

	markSpan.SetAttributes(attribute.Int("discount.marked.count", len(updatedCoupons)))
	return updatedCoupons, nil
}

func buildDiscountUsedResponse(
	user *models.User,
	staff *models.Staff,
	updatedCoupons []models.DiscountCoupon,
	total int,
	usedAt time.Time,
) discountUsedResponse {
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

	return resp
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
