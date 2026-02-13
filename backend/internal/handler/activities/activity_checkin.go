package activities

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type activityCheckInRequest struct {
	ActivityQRCode string `json:"activity_qr_code"`
}

// ActivityCheckIn handles POST /activities/check-ins.
// @Summary      使用者掃描活動 QR code 打卡
// @Description  使用者使用自己的 QR code 掃描器掃描活動的 QR code，幫自己在活動打卡。需要已登入的使用者 cookie。
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
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	var req activityCheckInRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.ActivityQRCode == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing qr code"), "missing qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	activity, err := h.Repo.GetActivityByQRCode(r.Context(), tx, req.ActivityQRCode)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("activity not found"), "activity not found")
			return
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch activity")
		return
	}

	inserted, err := h.Repo.AddVisited(r.Context(), tx, user.ID, activity.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to record visit")
		return
	}

	if inserted {
		err = h.Repo.IncrementUnlockLevel(r.Context(), tx, user.ID)
		if err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user unlock level")
			return
		}
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
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
