package activities

import (
	"encoding/json"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// BoothCount handles GET /activities/booth/count.
// @Summary      取得攤位打卡人數
// @Description  取得目前攤位的打卡人數，需要攤位的 token cookie。
// @Tags         activities
// @Produce      json
// @Success      200  {object}  map[string]int
// @Failure      401  {object}  res.ErrorResponse "unauthorized booth"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/booth/count [get]
func (h *Handler) BoothCount(w http.ResponseWriter, r *http.Request) {
	booth, ok := middleware.BoothFromContext(r.Context())
	if !ok || booth == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, nil, "unauthorized booth")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	count, err := h.Repo.CountVisitedByActivity(r.Context(), tx, booth.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to count visits")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]int{"count": count})
}
