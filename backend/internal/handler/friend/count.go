package friend

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type countResponse struct {
	Count int `json:"count"`
	Max   int `json:"max"`
}

// Count handles GET /friendships/stats.
// @Summary      取得好友數量及上限
// @Description  取得目前使用者的好友數量以及好友上限，好友上限會根據使用者參加過的活動數量而增加。
// @Tags         friends
// @Produce      json
// @Success      200  {object}  countResponse
// @Failure      401  {object}  res.ErrorResponse
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friendships/stats [get]
func (h *Handler) Count(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	total, err := h.Repo.CountFriends(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to count friends")
		return
	}
	visited, err := h.Repo.CountVisitedActivities(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to count visited activities")
		return
	}
	friendCap := helpers.FriendCapacity(visited)

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(countResponse{
		Count: total,
		Max:   friendCap,
	})
}
