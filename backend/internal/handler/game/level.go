package game

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// LevelInfoResponse is returned by GET /games/levels/{level}.
type LevelInfoResponse struct {
	Level int      `json:"level"`
	Speed int      `json:"speed"`
	Notes int      `json:"notes"`
	Sheet []string `json:"sheet"`
}

// GetLevelInfo handles GET /games/levels/{level}.
// @Summary      取得指定關卡資訊
// @Description  回傳指定 level 的速度與需要的音符數，以及對應的譜面片段。若 level 為 "current"，則取目前登入使用者的 current_level。
// @Tags         game
// @Produce      json
// @Param        level  path      string  true  "關卡等級 (從 1 開始) 或 'current'"
// @Success      200    {object}  LevelInfoResponse
// @Failure      400    {object}  res.ErrorResponse "invalid level"
// @Failure      401    {object}  res.ErrorResponse "unauthorized (when using current without login)"
// @Failure      403    {object}  res.ErrorResponse "requested level exceeds current level"
// @Failure      404    {object}  res.ErrorResponse "level not found"
// @Failure      500    {object}  res.ErrorResponse
// @Router       /games/levels/{level} [get]
func (h *Handler) GetLevelInfo(w http.ResponseWriter, r *http.Request) {
	levelParam := chi.URLParam(r, "level")
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, r, http.StatusUnauthorized, nil, "unauthorized")
		return
	}

	// current_level is 0-based, so we add 1 to get the 1-based playable level.
	maxAllowedLevel := user.CurrentLevel + 1
	if maxAllowedLevel <= 0 {
		res.Fail(w, r, http.StatusBadRequest, nil, "invalid current level")
		return
	}

	var (
		lvl int
		err error
	)

	if levelParam == "current" {
		lvl = maxAllowedLevel
	} else {
		lvl, err = strconv.Atoi(levelParam)
		if err != nil || lvl <= 0 {
			res.Fail(w, r, http.StatusBadRequest, err, "invalid level")
			return
		}
	}

	if lvl > maxAllowedLevel {
		res.Fail(w, r, http.StatusForbidden, nil, "requested level exceeds current level")
		return
	}

	info, ok, err := config.LevelInfo(lvl)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to load level config")
		return
	}
	if !ok {
		res.Fail(w, r, http.StatusNotFound, nil, "level not found")
		return
	}

	resp := LevelInfoResponse{
		Level: info.Level,
		Speed: info.Speed,
		Notes: info.Notes,
		Sheet: info.Sheet,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
