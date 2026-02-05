package activities

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// activityWithStatus is the payload for each activity in the list response.
type activityWithStatus struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Name    string `json:"name"`
	Visited bool   `json:"visited"`
}

// List handles GET /activities.
// @Summary      取得活動列表與使用者打卡狀態
// @Description  取得活動列表跟使用者在每個攤位、打卡、挑戰的狀態。需要登入才會回傳使用者的打卡狀態。
// @Tags         activities
// @Produce      json
// @Success      200  {array}   activityWithStatus
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/ [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	activities, err := h.Repo.ListActivities(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch activities")
		return
	}

	visitedIDs, err := h.Repo.ListVisitedActivityIDs(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch visited activities")
		return
	}
	visitedSet := make(map[string]struct{}, len(visitedIDs))
	for _, id := range visitedIDs {
		visitedSet[id] = struct{}{}
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := make([]activityWithStatus, 0, len(activities))
	for _, a := range activities {
		_, visited := visitedSet[a.ID]
		resp = append(resp, activityWithStatus{
			ID:      a.ID,
			Type:    string(a.Type),
			Name:    a.Name,
			Visited: visited,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
