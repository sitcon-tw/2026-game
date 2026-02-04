package friend

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"github.com/sitcon-tw/2026-game/pkg/utils"
)

// AddByQRCode handles POST /friends/{userQRCode}.
// @Summary      Add friend by QR code
// @Description  Adds a friend by scanning their QR code.
// @Tags         friends
// @Produce      json
// @Param        userQRCode  path      string  true  "User QR code token"
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friends/{userQRCode} [post]
func (h *Handler) AddByQRCode(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := middleware.UserFromContext(r.Context())
	if !ok || currentUser == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	qr := r.PathValue("userQRCode")
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

	targetUser, err := h.Repo.GetUserByQRCode(r.Context(), tx, qr)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch target user")
		return
	}
	if targetUser == nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("user not found"), "user not found")
		return
	}
	if targetUser.ID == currentUser.ID {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("cannot add self"), "cannot add yourself")
		return
	}

	// friend budget check for both users
	if err := h.ensureFriendCapacity(r.Context(), tx, currentUser.ID); err != nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, err, err.Error())
		return
	}
	if err := h.ensureFriendCapacity(r.Context(), tx, targetUser.ID); err != nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, err, err.Error())
		return
	}

	// NOTE: Should we change this feature so that only the scanning user can get the scan results?
	insertedA, err := h.Repo.AddFriend(r.Context(), tx, currentUser.ID, targetUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to add friend")
		return
	}
	insertedB, err := h.Repo.AddFriend(r.Context(), tx, targetUser.ID, currentUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to add friend")
		return
	}

	// Already friends: no insertion in either direction.
	if !insertedA && !insertedB {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("already friends"), "already friends")
		return
	}

	// Only increment unlock levels if a new friendship was created (both directions inserted or one of them)
	if insertedA || insertedB {
		if err := h.Repo.IncrementUnlockLevel(r.Context(), tx, currentUser.ID); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user")
			return
		}
		if err := h.Repo.IncrementUnlockLevel(r.Context(), tx, targetUser.ID); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update target user")
			return
		}
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ensureFriendCapacity(ctx context.Context, tx pgx.Tx, userID string) error {
	friendCount, err := h.Repo.CountFriends(ctx, tx, userID)
	if err != nil {
		return err
	}
	visitedCount, err := h.Repo.CountVisitedActivities(ctx, tx, userID)
	if err != nil {
		return err
	}

	// NOTE: It is 20 in the original spec, but changed to 10 for better gameplay balance.
	budget := utils.FriendCapacity(visitedCount)
	if friendCount >= budget {
		return errors.New("friend limit reached, visit more activities")
	}
	return nil
}
