package discount

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// ListStaffHistory handles GET /discount/history.
// Returns redemption history for the authenticated staff.
// @Summary      取得工作人員使用的折扣紀錄
// @Description  需要 staff token，回傳該 staff 操作的折扣券使用紀錄
// @Tags         discount
// @Produce      json
// @Success      200  {object}  []historyItem
// @Failure      400  {object}  res.ErrorResponse "missing token"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount/staff/history [get]
// @Param        Authorization  header  string  true  "Bearer {token}"
func (h *Handler) ListStaffHistory(w http.ResponseWriter, r *http.Request) {
	staff, ok := middleware.StaffFromContext(r.Context())
	if !ok || staff == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	histories, err := h.Repo.ListCouponHistoryByStaff(r.Context(), tx, staff.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to list history")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := make([]historyItem, 0, len(histories))
	for _, hst := range histories {
		resp = append(resp, historyItem{
			ID:      hst.ID,
			UserID:  hst.UserID,
			StaffID: hst.StaffID,
			Total:   hst.Total,
			UsedAt:  hst.UsedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

type historyItem struct {
	ID      string    `json:"id"`
	UserID  string    `json:"user_id"`
	StaffID string    `json:"staff_id"`
	Total   int       `json:"total"`
	UsedAt  time.Time `json:"used_at"`
}
