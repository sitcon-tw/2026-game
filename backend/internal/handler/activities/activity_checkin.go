package activities

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// ActivityCheckIn handles POST /activities/{activityQRCode}.
// @Summary      使用者掃描活動 QR code 打卡
// @Description  使用者使用自己的 QR code 掃描器掃描活動的 QR code，幫自己在活動打卡。需要已登入的使用者 cookie。
// @Tags         activities
// @Produce      json
// @Param        activityQRCode  path      string  true  "Activity QR code token"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  res.ErrorResponse "bad request"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/{activityQRCode} [post]
func (h *Handler) ActivityCheckIn(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	qr := chi.URLParam(r, "activityQRCode")
	if qr == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing qr code"), "missing qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	activity, err := h.Repo.GetActivityByQRCode(r.Context(), tx, qr)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch activity")
		return
	}
	if activity == nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("activity not found"), "activity not found")
		return
	}

	inserted, err := h.Repo.AddVisited(r.Context(), tx, user.ID, activity.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to record visit")
		return
	}

	if inserted {
		if err := h.Repo.IncrementUnlockLevel(r.Context(), tx, user.ID); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user unlock level")
			return
		}
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	status := "already checked in"
	if inserted {
		status = "check-in recorded"
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": status})
}
