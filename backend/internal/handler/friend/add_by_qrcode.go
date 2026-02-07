package friend

import (
	"context"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// AddByQRCode handles POST /friends/{userQRCode}.
// @Summary      用 QR code 加好友
// @Description  用 QR code 掃別人，別人就會變成你的好友，你也會變成他的好友。雙方好友數量都會增加 1，並且雙方的 unlock_level 都會增加 1。若已經是好友則不會重複加入。每個人最多只能有一定數量的好友，這個數量會隨著你參加過的活動數量（攤位、打卡...）而增加。
// @Tags         friends
// @Produce      json
// @Param        userQRCode  path      string  true  "User QR code token"
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friends/{userQRCode} [post]
func (h *Handler) AddByQRCode(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	currentUser, ok := h.getCurrentUserOrFail(ctx, w)
	if !ok {
		return
	}

	qr := chi.URLParam(r, "userQRCode")
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

	targetUser, ok := h.getTargetUserOrFail(ctx, w, tx, qr, currentUser.ID)
	if !ok {
		return
	}

	// friend capacity for both users
	err = h.ensureFriendCapacityForUsers(ctx, tx, currentUser.ID, targetUser.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, err, err.Error())
		return
	}

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

	if insertedA || insertedB {
		err = h.Repo.IncrementUnlockLevel(ctx, tx, currentUser.ID)
		if err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user")
			return
		}
		err = h.Repo.IncrementUnlockLevel(ctx, tx, targetUser.ID)
		if err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update target user")
			return
		}
	}

	err = h.Repo.CommitTransaction(ctx, tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) getCurrentUserOrFail(ctx context.Context, w http.ResponseWriter) (*models.User, bool) {
	currentUser, ok := middleware.UserFromContext(ctx)
	if !ok || currentUser == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return nil, false
	}
	return currentUser, true
}

func (h *Handler) getTargetUserOrFail(
	ctx context.Context,
	w http.ResponseWriter,
	tx pgx.Tx,
	qr string,
	currentUserID string,
) (*models.User, bool) {
	targetUser, err := h.Repo.GetUserByQRCode(ctx, tx, qr)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("user not found"), "user not found")
			return nil, false
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch target user")
		return nil, false
	}
	if targetUser == nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("user not found"), "user not found")
		return nil, false
	}
	if targetUser.ID == currentUserID {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("cannot add yourself"), "cannot add yourself")
		return nil, false
	}
	return targetUser, true
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

	budget := helpers.FriendCapacity(visitedCount)
	if friendCount >= budget {
		return errors.New("friend limit reached, visit more activities")
	}
	return nil
}

func (h *Handler) ensureFriendCapacityForUsers(ctx context.Context, tx pgx.Tx, userIDs ...string) error {
	for _, id := range userIDs {
		err := h.ensureFriendCapacity(ctx, tx, id)
		if err != nil {
			return err
		}
	}
	return nil
}
