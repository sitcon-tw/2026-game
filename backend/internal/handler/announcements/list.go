package announcements

import (
	"encoding/json"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// List handles GET /announcements.
// @Summary      取得公告列表
// @Description  取得最新公告，依 created_at 由新到舊排序。不需要登入。
// @Tags         announcements
// @Produce      json
// @Success      200  {array}   models.Announcement
// @Failure      500  {object}  res.ErrorResponse
// @Router       /announcements [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	items, err := h.Repo.ListAnnouncements(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to fetch announcements")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(items)
}
