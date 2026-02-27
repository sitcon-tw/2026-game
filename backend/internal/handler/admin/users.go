package admin

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

const (
	defaultSearchLimit = 20
	maxSearchLimit     = 100
)

// SearchUsers handles GET /admin/users?q=keyword&limit=20.
// @Summary      搜尋使用者
// @Description  需要 admin_token cookie。使用 nickname 做全文/模糊搜尋並回傳使用者列表。
// @Tags         admin
// @Produce      json
// @Param        q            query     string  true   "Search keyword"
// @Param        limit        query     int     false  "Result limit (default 20, max 100)"
// @Success      200          {array}   models.User
// @Failure      400          {object}  res.ErrorResponse "missing q | invalid limit"
// @Failure      401          {object}  res.ErrorResponse "unauthorized"
// @Failure      500          {object}  res.ErrorResponse
// @Router       /admin/users [get]
func (h *Handler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing q"), "missing q")
		return
	}

	limit := defaultSearchLimit
	if raw := r.URL.Query().Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n <= 0 {
			res.Fail(w, r, http.StatusBadRequest, errors.New("invalid limit"), "invalid limit")
			return
		}
		if n > maxSearchLimit {
			n = maxSearchLimit
		}
		limit = n
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	users, err := h.Repo.SearchUsersByNickname(r.Context(), tx, query, limit)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to search users")
		return
	}

	if err = h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(users)
}
