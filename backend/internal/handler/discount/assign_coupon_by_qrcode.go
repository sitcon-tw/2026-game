package discount

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type assignCouponByQRCodeRequest struct {
	UserQRCode string `json:"user_qr_code"`
	Price      int    `json:"price"`
	DiscountID string `json:"discount_id"`
}

var (
	errScanTargetUserNotFound = errors.New("scan target user not found")
	errScanLookupFailed       = errors.New("scan target lookup failed")
)

// AssignCouponByQRCode handles POST /discount-coupons/staff/scan-assignments.
// @Summary      掃描使用者 QR code 發放折扣券（工作人員）
// @Description  需要 staff_token cookie。透過使用者的一次性 QR code 發放折扣券，並防止同一 user+discount 重複發放。
// @Tags         discount
// @Accept       json
// @Produce      json
// @Param        request      body      assignCouponByQRCodeRequest  true  "Assign coupon by QR payload"
// @Success      201          {object}  models.DiscountCoupon
// @Failure      400          {object}  res.ErrorResponse "invalid payload | invalid qr code"
// @Failure      401          {object}  res.ErrorResponse "unauthorized"
// @Failure      404          {object}  res.ErrorResponse "user not found"
// @Failure      409          {object}  res.ErrorResponse "already issued by qr scan"
// @Failure      500          {object}  res.ErrorResponse
// @Router       /discount-coupons/staff/scan-assignments [post]
func (h *Handler) AssignCouponByQRCode(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	var req assignCouponByQRCodeRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.UserQRCode == "" || req.Price <= 0 || req.DiscountID == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("invalid user_qr_code, price or discount_id"), "invalid payload")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	userID, err := h.resolveUserIDFromOneTimeQRCode(r.Context(), tx, req.UserQRCode)
	if err != nil {
		switch {
		case errors.Is(err, errScanTargetUserNotFound):
			res.Fail(w, r, http.StatusNotFound, err, "user not found")
		case errors.Is(err, errScanLookupFailed):
			res.Fail(w, r, http.StatusInternalServerError, err, "failed to verify qr code")
		default:
			res.Fail(w, r, http.StatusBadRequest, err, "invalid qr code")
		}
		return
	}

	marked, err := h.Repo.TryMarkStaffScanCouponIssued(r.Context(), tx, userID, req.DiscountID, staff.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to mark staff scan issuance")
		return
	}
	if !marked {
		res.Fail(w, r, http.StatusConflict, errors.New("coupon already issued by qr scan"), "already issued by qr scan")
		return
	}

	coupon, err := h.Repo.InsertDiscountCouponForUser(r.Context(), tx, userID, req.Price, req.DiscountID)
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

// ListStaffScanHistory handles GET /discount-coupons/staff/current/scan-assignments.
// @Summary      取得工作人員掃碼發券紀錄
// @Description  需要 staff_token cookie，回傳該 staff 透過掃碼發放折扣券的紀錄
// @Tags         discount
// @Produce      json
// @Success      200  {array}   models.StaffQRCouponGrant
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount-coupons/staff/current/scan-assignments [get]
func (h *Handler) ListStaffScanHistory(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	grants, err := h.Repo.ListStaffScanCouponGrants(r.Context(), tx, staff.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list scan history")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	type scanGrantItem struct {
		UserID     string    `json:"user_id"`
		Nickname   string    `json:"nickname"`
		DiscountID string    `json:"discount_id"`
		StaffID    string    `json:"staff_id"`
		CreatedAt  time.Time `json:"created_at"`
	}

	resp := make([]scanGrantItem, 0, len(grants))
	for _, g := range grants {
		resp = append(resp, scanGrantItem{
			UserID:     g.UserID,
			Nickname:   g.Nickname,
			DiscountID: g.DiscountID,
			StaffID:    g.StaffID,
			CreatedAt:  g.CreatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) resolveUserIDFromOneTimeQRCode(ctx context.Context, tx pgx.Tx, token string) (string, error) {
	userID, err := helpers.VerifyAndExtractUserIDFromOneTimeQRToken(
		token,
		time.Now().UTC(),
		func(targetUserID string) (string, error) {
			targetUser, lookupErr := h.Repo.GetUserByID(ctx, tx, targetUserID)
			if lookupErr != nil {
				if errors.Is(lookupErr, repository.ErrNotFound) {
					return "", errScanTargetUserNotFound
				}
				return "", fmt.Errorf("%w: %w", errScanLookupFailed, lookupErr)
			}
			return targetUser.QRCodeToken, nil
		},
	)
	if err != nil {
		if errors.Is(err, errScanTargetUserNotFound) {
			return "", err
		}
		if errors.Is(err, errScanLookupFailed) {
			return "", err
		}
		return "", errors.New("invalid one-time qr token")
	}

	if _, err = h.Repo.GetUserByID(ctx, tx, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", errScanTargetUserNotFound
		}
		return "", err
	}

	return userID, nil
}
