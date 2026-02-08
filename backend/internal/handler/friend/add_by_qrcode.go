package friend

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type addFriendRequest struct {
	UserQRCode string `json:"user_qr_code"`
}

// AddByQRCode handles POST /friends.
// @Summary      建立好友關係
// @Description  透過對方的 QR code 建立好友關係，雙方好友數量與 unlock_level 會在首次建立時各自增加。
// @Tags         friends
// @Accept       json
// @Produce      json
// @Param        body  body  addFriendRequest  true  "Friend request payload"
// @Success      200  {string}  string  ""
// @Failure      400  {object}  res.ErrorResponse "missing or invalid qr code"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friends [post]
func (h *Handler) AddByQRCode(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	currentUser, ok := middleware.UserFromContext(ctx)
	if !ok || currentUser == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	var payload addFriendRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, err, "invalid json")
		return
	}
	qr := payload.UserQRCode
	if qr == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing qr code"), "missing qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(ctx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(ctx, tx)

	targetUser, err := h.Repo.GetUserByQRCode(ctx, tx, qr)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("user not found"), "user not found")
			return
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch target user")
		return
	}
	if targetUser == nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("user not found"), "user not found")
		return
	}
	if targetUser.ID == currentUser.ID {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("cannot add yourself"), "cannot add yourself")
		return
	}

	// eligibility: current user
	currentFriendCount, err := h.Repo.CountFriends(ctx, tx, currentUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to check current user friend capacity")
		return
	}
	currentVisitedCount, err := h.Repo.CountVisitedActivities(ctx, tx, currentUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to check current user friend capacity")
		return
	}
	currentBudget := helpers.FriendCapacity(currentVisitedCount)
	currentUserCanUnlock := currentFriendCount < currentBudget

	// eligibility: target user
	targetFriendCount, err := h.Repo.CountFriends(ctx, tx, targetUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to check target user friend capacity")
		return
	}
	targetVisitedCount, err := h.Repo.CountVisitedActivities(ctx, tx, targetUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to check target user friend capacity")
		return
	}
	targetBudget := helpers.FriendCapacity(targetVisitedCount)
	targetUserCanUnlock := targetFriendCount < targetBudget

	insertedA, err := h.Repo.AddFriend(ctx, tx, currentUser.ID, targetUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to add friend")
		return
	}
	insertedB, err := h.Repo.AddFriend(ctx, tx, targetUser.ID, currentUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to add friend")
		return
	}

	if !insertedA && !insertedB {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("already friends"), "already friends")
		return
	}

	if currentUserCanUnlock {
		if err := h.Repo.IncrementUnlockLevel(ctx, tx, currentUser.ID); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user")
			return
		}
	}
	if targetUserCanUnlock {
		if err := h.Repo.IncrementUnlockLevel(ctx, tx, targetUser.ID); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update target user")
			return
		}
	}

	if err := h.Repo.CommitTransaction(ctx, tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.WriteHeader(http.StatusOK)
}