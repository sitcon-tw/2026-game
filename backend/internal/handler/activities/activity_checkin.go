package activities

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type activityCheckInRequest struct {
	ActivityQRCode string `json:"activity_qr_code"`
}

// ActivityCheckIn handles POST /activities/check-ins.
// @Summary      使用者掃描活動 QR code 打卡
// @Description  使用者使用自己的 QR code 掃描器掃描活動的 QR code，幫自己在 check 類型活動打卡。首次打卡成功 unlock_level +2。需要已登入的使用者 cookie。
// @Tags         activities
// @Accept       json
// @Produce      json
// @Param        request  body      activityCheckInRequest  true  "Activity QR code token"
// @Success      200  {object}  checkinResponse
// @Failure      400  {object}  res.ErrorResponse "bad request"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/check-ins [post]
func (h *Handler) ActivityCheckIn(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	var req activityCheckInRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.ActivityQRCode == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing qr code"), "missing qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	inserted, err := h.doActivityCheckIn(r, tx, user.ID, req.ActivityQRCode)
	if err != nil {
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

	status := "already checked in"
	if inserted {
		status = "check-in recorded"
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(checkinResponse{Status: status})
}

type checkinError struct {
	status  int
	message string
	cause   error
}

func (e *checkinError) Error() string { return e.message }
func (e *checkinError) Unwrap() error { return e.cause }

func newCheckinErr(status int, cause error, message string) *checkinError {
	return &checkinError{status: status, message: message, cause: cause}
}

func (h *Handler) doActivityCheckIn(r *http.Request, tx pgx.Tx, userID, qrCode string) (bool, error) {
	activity, err := h.Repo.GetActivityByQRCode(r.Context(), tx, qrCode)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return false, newCheckinErr(http.StatusBadRequest, errors.New("activity not found"), "activity not found")
		}
		return false, newCheckinErr(http.StatusInternalServerError, err, "failed to fetch activity")
	}

	if activity.Type != models.ActivitiesTypeCheck {
		return false, newCheckinErr(http.StatusBadRequest, nil, "activity does not support user self check-in")
	}

	inserted, err := h.Repo.AddVisited(r.Context(), tx, userID, activity.ID)
	if err != nil {
		return false, newCheckinErr(http.StatusInternalServerError, err, "failed to record visit")
	}

	if inserted {
		if err = h.applyActivityCheckInRewards(r.Context(), tx, userID, activity.Type); err != nil {
			return false, err
		}
	}

	return inserted, nil
}

func (h *Handler) applyActivityCheckInRewards(ctx context.Context, tx pgx.Tx, userID string, activityType models.ActivitiesTypes) error {
	increment, _ := unlockIncrementByActivityType(activityType)
	if err := h.Repo.IncrementUnlockLevelBy(ctx, tx, userID, increment); err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to update user unlock level")
	}
	if err := h.issueCheckInCoupon(ctx, tx, userID); err != nil {
		return newCheckinErr(http.StatusInternalServerError, err, "failed to issue coupon")
	}
	return nil
}
