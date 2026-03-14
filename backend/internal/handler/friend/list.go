package friend

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type friendPublicProfile struct {
	ID           string  `json:"id"`
	Nickname     string  `json:"nickname"`
	Avatar       *string `json:"avatar,omitempty"`
	CurrentLevel int     `json:"current_level"`
}

// List handles GET /friendships.
// @Summary      取得好友列表
// @Description  取得目前使用者所有好友的公開資料，不包含任何私密欄位。
// @Tags         friends
// @Produce      json
// @Success      200  {array}   friendPublicProfile
// @Failure      401  {object}  res.ErrorResponse
// @Failure      500  {object}  res.ErrorResponse
// @Router       /friendships [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
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

	friends, err := h.Repo.ListFriends(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to fetch friends")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := make([]friendPublicProfile, 0, len(friends))
	for _, friend := range friends {
		resp = append(resp, friendPublicProfile{
			ID:           friend.ID,
			Nickname:     friend.Nickname,
			Avatar:       friend.Avatar,
			CurrentLevel: friend.CurrentLevel,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
