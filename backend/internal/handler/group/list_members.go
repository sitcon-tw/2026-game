package group

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// memberResponse is a single group member entry including check-in status.
type memberResponse struct {
	models.PublicUser

	CheckedIn bool `json:"checked_in"`
}

// ListMembers handles GET /group/members.
// @Summary      取得 group 成員列表
// @Description  取得目前使用者所屬 group 的所有成員，並標示是否已互相簽到過。
// @Tags         group
// @Produce      json
// @Success      200  {array}   memberResponse
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      403  {object}  res.ErrorResponse "not in any group"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /group/members [get]
func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	currentUser, ok := middleware.UserFromContext(ctx)
	if !ok || currentUser == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	if currentUser.Group == nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode([]memberResponse{})
		return
	}

	tx, err := h.Repo.StartTransaction(ctx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(ctx, tx)

	members, err := h.Repo.ListGroupMembers(ctx, tx, currentUser.ID, *currentUser.Group)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list group members")
		return
	}

	// Fetch all check-ins for current user to build a lookup set.
	checkIns, err := h.Repo.ListGroupCheckInsByUser(ctx, tx, currentUser.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to list group check-ins")
		return
	}

	checkedInWith := make(map[string]bool, len(checkIns))
	for _, ci := range checkIns {
		if ci.UserAID == currentUser.ID {
			checkedInWith[ci.UserBID] = true
		} else {
			checkedInWith[ci.UserAID] = true
		}
	}

	result := make([]memberResponse, 0, len(members))
	for _, m := range members {
		result = append(result, memberResponse{
			PublicUser: models.ToPublicUser(m),
			CheckedIn:  checkedInWith[m.ID],
		})
	}

	if err = h.Repo.CommitTransaction(ctx, tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}
