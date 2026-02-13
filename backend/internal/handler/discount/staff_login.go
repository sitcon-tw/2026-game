package discount

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// StaffLogin handles POST /discount-coupons/staff/session.
// @Summary      工作人員登入
// @Description  工作人員使用此 API 登入系統，成功後會在 cookie 設定 staff_token，之後就可以使用 cookie 來呼叫需要 staff 身分的 endpoint。
// @Tags         discount
// @Produce      json
// @Success      200  {object}  models.Staff
// @Failure      400  {object}  res.ErrorResponse "missing token"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Failure      500  {object}  res.ErrorResponse
// @Param        Authorization  header  string  true  "Bearer {token}"
// @Router       /discount-coupons/staff/session [post]
func (h *Handler) StaffLogin(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Accept token from Authorization for backward compatibility; issue cookie for future requests.
	token := helpers.BearerToken(r.Header.Get("Authorization"))
	if token == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing token"), "missing token")
		return
	}

	tx, err := h.Repo.StartTransaction(ctx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(ctx, tx)

	staff, err := h.Repo.GetStaffByToken(ctx, tx, token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusUnauthorized, err, "unauthorized staff")
			return
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to query staff")
		return
	}
	if staff == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	err = h.Repo.CommitTransaction(ctx, tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	http.SetCookie(w, helpers.NewCookie("staff_token", staff.Token, 30*24*time.Hour))

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(staff)
}
