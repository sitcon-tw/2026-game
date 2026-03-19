package activities

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type boothCheckInRequest struct {
	UserQRCode string `json:"user_qr_code"`
}

// BoothCheckIn handles POST /activities/booth/user/check-ins.
// @Summary      攤位掃描使用者 QR code 打卡
// @Description  可掃描使用者的活動工作人員（攤位/闖關）使用活動專用登入後掃描使用者 QR code。首次打卡成功會依活動類型增加 unlock_level：booth +2、challenge +3。
// @Tags         activities
// @Accept       json
// @Produce      json
// @Param        request  body      boothCheckInRequest  true  "User QR code token"
// @Success      200  {object}  checkinResponse
// @Failure      400  {object}  res.ErrorResponse "bad request"
// @Failure      401  {object}  res.ErrorResponse "unauthorized booth"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/booth/user/check-ins [post]
func (h *Handler) BoothCheckIn(w http.ResponseWriter, r *http.Request) {
	booth, ok := middleware.BoothFromContext(r.Context())
	if !ok || booth == nil {
		res.Fail(w, r, http.StatusUnauthorized, nil, "unauthorized booth")
		return
	}

	var req boothCheckInRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.UserQRCode == "" {
		res.Fail(w, r, http.StatusBadRequest, nil, "missing user qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	targetUserID, err := h.resolveUserIDFromQRCode(r, tx, req.UserQRCode)
	if err != nil {
		var ce *checkinError
		if errors.As(err, &ce) {
			res.Fail(w, r, ce.status, ce.cause, ce.message)
		} else {
			res.Fail(w, r, http.StatusBadRequest, err, "invalid or expired user qr code")
		}
		return
	}

	if err = h.processBoothVisit(r.Context(), tx, targetUserID, booth.ID, booth.Name, booth.Type); err != nil {
		var ce *checkinError
		if errors.As(err, &ce) {
			res.Fail(w, r, ce.status, ce.cause, ce.message)
		} else {
			res.Fail(w, r, http.StatusInternalServerError, err, "internal error")
		}
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(checkinResponse{Status: "visit recorded"})
}

func (h *Handler) resolveUserIDFromQRCode(r *http.Request, tx pgx.Tx, qrCode string) (string, error) {
	userID, err := helpers.VerifyAndExtractUserIDFromOneTimeQRToken(
		qrCode,
		time.Now().UTC(),
		func(uid string) (string, error) {
			u, lookupErr := h.Repo.GetUserByID(r.Context(), tx, uid)
			if lookupErr != nil {
				if errors.Is(lookupErr, repository.ErrNotFound) {
					return "", repository.ErrNotFound
				}
				return "", lookupErr
			}
			return u.QRCodeToken, nil
		},
	)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", newCheckinErr(http.StatusBadRequest, nil, "user not found")
		}
		return "", err
	}

	if _, err = h.Repo.GetUserByID(r.Context(), tx, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", newCheckinErr(http.StatusBadRequest, nil, "user not found")
		}
		return "", newCheckinErr(http.StatusInternalServerError, err, "failed to fetch user")
	}

	return userID, nil
}

func (h *Handler) processBoothVisit(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	boothID string,
	boothName string,
	boothType models.ActivitiesTypes,
) error {
	inserted, err := h.Repo.AddVisited(ctx, tx, userID, boothID)
	if err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to record visit")
	}
	if !inserted {
		return newCheckinErr(http.StatusBadRequest, nil, "already visited")
	}

	increment, ok := unlockIncrementByActivityType(boothType)
	if !ok {
		return newCheckinErr(http.StatusBadRequest, nil, "unsupported activity type")
	}

	if err = h.Repo.IncrementUnlockLevelBy(ctx, tx, userID, increment); err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to update user unlock level")
	}
	if err = h.issueCheckInCoupon(ctx, tx, userID); err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to issue coupon")
	}
	if err = h.issueTourGroupChallengeCoupon(ctx, tx, userID, boothName, boothType); err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to issue coupon")
	}

	return nil
}
