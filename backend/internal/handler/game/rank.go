package game

import (
	"encoding/json"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// Rank handles GET /game/rank.
// @Summary      Get game rank
// @Description  Returns ranking info for the current user.
// @Tags         game
// @Produce      json
// @Success      200  {object}  RankResponse  ""
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /game/rank [get]
func (h *Handler) Rank(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, nil, "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	top10Rows, aroundRows, meRow, err := h.Repo.GetLeaderboard(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch leaderboard")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	// Convert repository rows to DTOs
	toDTO := func(rows []models.RankRow) []RankEntry {
		out := make([]RankEntry, len(rows))
		for i, r := range rows {
			out[i] = RankEntry{Nickname: r.Nickname, Level: r.Level, Rank: r.Rank}
		}
		return out
	}

	var me *RankEntry
	if meRow != nil {
		me = &RankEntry{Nickname: meRow.Nickname, Level: meRow.Level, Rank: meRow.Rank}
	}

	resp := RankResponse{
		Top10:  toDTO(top10Rows),
		Around: toDTO(aroundRows),
		Me:     me,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
