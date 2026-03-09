package activities

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

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

	targetUserID, err := helpers.VerifyAndExtractUserIDFromOneTimeQRToken(
		req.UserQRCode,
		time.Now().UTC(),
		func(userID string) (string, error) {
			targetUser, lookupErr := h.Repo.GetUserByID(r.Context(), tx, userID)
			if lookupErr != nil {
				if errors.Is(lookupErr, repository.ErrNotFound) {
					return "", repository.ErrNotFound
				}
				return "", lookupErr
			}
			return targetUser.QRCodeToken, nil
		},
	)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusBadRequest, nil, "user not found")
			return
		}
		res.Fail(w, r, http.StatusBadRequest, err, "invalid or expired user qr code")
		return
	}

	user, err := h.Repo.GetUserByID(r.Context(), tx, targetUserID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, r, http.StatusBadRequest, nil, "user not found")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to fetch user")
		return
	}

	inserted, err := h.Repo.AddVisited(r.Context(), tx, user.ID, booth.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to record visit")
		return
	}
	if !inserted {
		res.Fail(w, r, http.StatusBadRequest, nil, "already visited")
		return
	}

	increment, ok := unlockIncrementByActivityType(booth.Type)
	if !ok {
		res.Fail(w, r, http.StatusBadRequest, nil, "unsupported activity type")
		return
	}

	err = h.Repo.IncrementUnlockLevelBy(r.Context(), tx, user.ID, increment)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to update user unlock level")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(checkinResponse{Status: "visit recorded"})
}
