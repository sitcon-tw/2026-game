package game

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// Rank handles GET /game/rank.
// @Summary      取得遊戲的排行資料
// @Description  排行資料會包含三個部分：1. 全站前30名玩家的暱稱、等級與排名 2. 以目前使用者為中心，前後各5名玩家的暱稱、等級與排名 3. 目前使用者的暱稱、等級與排名。需要登入後才能取得排行資料。支援 page 查詢參數來分頁瀏覽全站排行，每頁30名玩家，預設為第1頁。
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

	// Pagination for top users
	const pageSize = 30
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		} else {
			res.Fail(w, h.Logger, http.StatusBadRequest, nil, "invalid page parameter")
			return
		}
	}
	offset := (page - 1) * pageSize

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	// Fetch pieces individually to keep repository concerns separated.
	topRows, err := h.Repo.GetTopUsers(r.Context(), tx, pageSize, offset)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch top users")
		return
	}

	meRow, meRank, err := h.Repo.GetUserWithRank(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch user rank")
		return
	}

	aroundRows, err := h.Repo.GetAroundUsers(r.Context(), tx, user.ID, 5)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch around users")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	top := make([]RankEntry, len(topRows))
	startRankTop := offset + 1
	for i, u := range topRows {
		top[i] = RankEntry{
			Nickname: u.Nickname,
			Level:    u.CurrentLevel,
			Rank:     startRankTop + i,
		}
	}

	var me *RankEntry
	if meRow != nil {
		me = &RankEntry{Nickname: meRow.Nickname, Level: meRow.CurrentLevel, Rank: meRank}
	}

	around := make([]RankEntry, len(aroundRows))
	// Start rank based on meRank - 5, but not below 1.
	startRank := meRank - 5
	startRank = max(startRank, 1)

	for i, u := range aroundRows {
		around[i] = RankEntry{
			Nickname: u.Nickname,
			Level:    u.CurrentLevel,
			Rank:     startRank + i,
		}
	}

	resp := RankResponse{
		Top10:  top,
		Around: around,
		Me:     me,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
