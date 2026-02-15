package friend

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

type addByQRCodeRequest struct {
	UserQRCode string `json:"user_qr_code"`
}

var (
	errUserNotFound   = errors.New("user not found")
	errCannotAddSelf  = errors.New("cannot add yourself")
	errAlreadyFriends = errors.New("already friends")
)

type friendCapacity struct {
	canUnlock bool
}

// AddByQRCode handles POST /friendships.
// @Summary      建立好友關係
// @Description  透過對方的 QR code 建立好友關係，雙方好友數量與 unlock_level 會在首次建立時各自增加。
// @Tags         friends
// @Accept       json
// @Produce      json
// @Param        request  body      addByQRCodeRequest  true  "User QR code token"
// @Success      200  {string}  string  ""
// @Failure      400  {object}  res.ErrorResponse "missing or invalid qr code"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friendships [post]
func (h *Handler) AddByQRCode(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	currentUser, ok := middleware.UserFromContext(ctx)
	if !ok || currentUser == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	req, err := parseAddByQRCodeRequest(r)
	if err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}

	err = h.addByQRCode(ctx, currentUser.ID, req.UserQRCode)
	if err != nil {
		h.respondAddByQRCodeError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) addByQRCode(ctx context.Context, currentUserID string, userQRCode string) error {
	tx, err := h.Repo.StartTransaction(ctx)
	if err != nil {
		return err
	}
	defer h.Repo.DeferRollback(ctx, tx)

	targetUser, err := h.loadTargetUser(ctx, tx, userQRCode, currentUserID)
	if err != nil {
		return err
	}

	currentCapacity, err := h.checkFriendCapacity(ctx, tx, currentUserID, "friend.capacity_check.current", "friend.current")
	if err != nil {
		return err
	}
	targetCapacity, err := h.checkFriendCapacity(ctx, tx, targetUser.ID, "friend.capacity_check.target", "friend.target")
	if err != nil {
		return err
	}

	insertedA, insertedB, err := h.insertBidirectionalFriend(ctx, tx, currentUserID, targetUser.ID)
	if err != nil {
		return err
	}

	err = h.incrementUnlockIfNeeded(ctx, tx, insertedA, currentCapacity.canUnlock, currentUserID)
	if err != nil {
		return err
	}
	err = h.incrementUnlockIfNeeded(ctx, tx, insertedB, targetCapacity.canUnlock, targetUser.ID)
	if err != nil {
		return err
	}

	err = h.Repo.CommitTransaction(ctx, tx)
	if err != nil {
		return err
	}

	return nil
}

func (h *Handler) respondAddByQRCodeError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, errUserNotFound):
		res.Fail(w, r, http.StatusBadRequest, err, "user not found")
	case errors.Is(err, errCannotAddSelf):
		res.Fail(w, r, http.StatusBadRequest, err, "cannot add yourself")
	case errors.Is(err, errAlreadyFriends):
		res.Fail(w, r, http.StatusBadRequest, err, "already friends")
	default:
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to add friend")
	}
}

func parseAddByQRCodeRequest(r *http.Request) (addByQRCodeRequest, error) {
	var req addByQRCodeRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		return addByQRCodeRequest{}, err
	}
	if req.UserQRCode == "" {
		return addByQRCodeRequest{}, errors.New("missing qr code")
	}
	return req, nil
}

func (h *Handler) loadTargetUser(ctx context.Context, tx pgx.Tx, userQRCode string, currentUserID string) (*models.User, error) {
	targetUser, err := h.Repo.GetUserByQRCode(ctx, tx, userQRCode)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, errUserNotFound
		}
		return nil, err
	}
	if targetUser == nil {
		return nil, errUserNotFound
	}
	if targetUser.ID == currentUserID {
		return nil, errCannotAddSelf
	}
	return targetUser, nil
}

func (h *Handler) checkFriendCapacity(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	spanName string,
	attrPrefix string,
) (friendCapacity, error) {
	spanCtx, span := h.tracer.Start(ctx, spanName)
	defer span.End()

	friendCount, err := h.Repo.CountFriends(spanCtx, tx, userID)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "count friends failed")
		return friendCapacity{}, err
	}

	visitedCount, err := h.Repo.CountVisitedActivities(spanCtx, tx, userID)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "count visited activities failed")
		return friendCapacity{}, err
	}

	budget := helpers.FriendCapacity(visitedCount)
	canUnlock := friendCount < budget
	span.SetAttributes(
		attribute.Int(attrPrefix+".count", friendCount),
		attribute.Int(attrPrefix+".visited", visitedCount),
		attribute.Int(attrPrefix+".budget", budget),
		attribute.Bool(attrPrefix+".can_unlock", canUnlock),
	)

	return friendCapacity{canUnlock: canUnlock}, nil
}

func (h *Handler) insertBidirectionalFriend(ctx context.Context, tx pgx.Tx, currentUserID string, targetUserID string) (bool, bool, error) {
	spanCtx, span := h.tracer.Start(ctx, "friend.insert_bidirectional")
	defer span.End()

	insertedA, err := h.Repo.AddFriend(spanCtx, tx, currentUserID, targetUserID)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "insert current->target failed")
		return false, false, err
	}

	insertedB, err := h.Repo.AddFriend(spanCtx, tx, targetUserID, currentUserID)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "insert target->current failed")
		return false, false, err
	}

	span.SetAttributes(
		attribute.Bool("friend.inserted.current_to_target", insertedA),
		attribute.Bool("friend.inserted.target_to_current", insertedB),
	)

	if !insertedA && !insertedB {
		return false, false, errAlreadyFriends
	}

	return insertedA, insertedB, nil
}

func (h *Handler) incrementUnlockIfNeeded(ctx context.Context, tx pgx.Tx, inserted bool, canUnlock bool, userID string) error {
	if !inserted || !canUnlock {
		return nil
	}
	return h.Repo.IncrementUnlockLevel(ctx, tx, userID)
}
