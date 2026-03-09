package group

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type checkInRequest struct {
	UserQRCode string `json:"user_qr_code"`
}

var (
	errTargetUserNotFound = errors.New("target user not found")
	errCannotCheckInSelf  = errors.New("cannot check in with yourself")
	errNotInSameGroup     = errors.New("not in the same group")
	errCurrentNotInGroup  = errors.New("you are not in any group")
	errAlreadyCheckedIn   = errors.New("already checked in with this member")
)

const unlockIncrementGroupCheckIn = 4

// CheckIn handles POST /group/check-ins.
// @Summary      group 互相簽到
// @Description  掃描同 group 成員的 one-time QR code，雙方各增加 4 次 unlock_level。每對只能簽到一次。
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        request  body      checkInRequest  true  "對方的 one-time QR code token"
// @Success      200  {string}  string  ""
// @Failure      400  {object}  res.ErrorResponse
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      403  {object}  res.ErrorResponse "not in group / not same group"
// @Failure      409  {object}  res.ErrorResponse "already checked in"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /group/check-ins [post]
func (h *Handler) CheckIn(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	currentUser, ok := middleware.UserFromContext(ctx)
	if !ok || currentUser == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	if currentUser.Group == nil {
		res.Fail(w, r, http.StatusForbidden, errCurrentNotInGroup, "you are not in any group")
		return
	}

	var req checkInRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}
	if req.UserQRCode == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing user_qr_code"), "missing user_qr_code")
		return
	}

	if err := h.checkIn(ctx, currentUser, req.UserQRCode); err != nil {
		h.respondCheckInError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) checkIn(ctx context.Context, currentUser *models.User, userQRCode string) error {
	tx, err := h.Repo.StartTransaction(ctx)
	if err != nil {
		return err
	}
	defer h.Repo.DeferRollback(ctx, tx)

	// Resolve target user via one-time QR token, using the open tx for DB lookups.
	targetUserID, err := helpers.VerifyAndExtractUserIDFromOneTimeQRToken(
		userQRCode,
		time.Now().UTC(),
		func(userID string) (string, error) {
			u, lookupErr := h.Repo.GetUserByID(ctx, tx, userID)
			if lookupErr != nil {
				if errors.Is(lookupErr, repository.ErrNotFound) {
					return "", errTargetUserNotFound
				}
				return "", lookupErr
			}
			return u.QRCodeToken, nil
		},
	)
	if err != nil {
		return errTargetUserNotFound
	}

	if targetUserID == currentUser.ID {
		return errCannotCheckInSelf
	}

	targetUser, err := h.Repo.GetUserByID(ctx, tx, targetUserID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return errTargetUserNotFound
		}
		return err
	}

	// Verify target is in the same group.
	if targetUser.Group == nil || *targetUser.Group != *currentUser.Group {
		return errNotInSameGroup
	}

	// Insert canonical check-in record; ON CONFLICT DO NOTHING returns false if already exists.
	inserted, err := h.Repo.InsertGroupCheckIn(ctx, tx, currentUser.ID, targetUser.ID)
	if err != nil {
		return err
	}
	if !inserted {
		return errAlreadyCheckedIn
	}

	// Both parties get unlock_level +4.
	if err = h.Repo.IncrementUnlockLevelBy(ctx, tx, currentUser.ID, unlockIncrementGroupCheckIn); err != nil {
		return err
	}
	if err = h.Repo.IncrementUnlockLevelBy(ctx, tx, targetUser.ID, unlockIncrementGroupCheckIn); err != nil {
		return err
	}

	return h.Repo.CommitTransaction(ctx, tx)
}

func (h *Handler) respondCheckInError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errTargetUserNotFound):
		res.Fail(w, r, http.StatusBadRequest, err, "user not found")
	case errors.Is(err, errCannotCheckInSelf):
		res.Fail(w, r, http.StatusBadRequest, err, "cannot check in with yourself")
	case errors.Is(err, errCurrentNotInGroup):
		res.Fail(w, r, http.StatusForbidden, err, "you are not in any group")
	case errors.Is(err, errNotInSameGroup):
		res.Fail(w, r, http.StatusForbidden, err, "not in the same group")
	case errors.Is(err, errAlreadyCheckedIn):
		res.Fail(w, r, http.StatusConflict, err, "already checked in with this member")
	default:
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to check in")
	}
}
