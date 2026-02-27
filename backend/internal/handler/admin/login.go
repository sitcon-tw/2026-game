package admin

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

const adminSessionTTL = 30 * 24 * time.Hour

type loginResponse struct {
	Authenticated bool `json:"authenticated"`
}

// Login handles POST /admin/session.
// Uses Authorization Bearer admin key and issues admin_token cookie.
// @Summary      管理員登入
// @Description  使用 Authorization Bearer ADMIN_KEY 登入，成功後會設定 admin_token cookie 供後續 admin API 使用。
// @Tags         admin
// @Produce      json
// @Param        Authorization  header    string  true  "Bearer {admin_key}"
// @Success      200            {object}  loginResponse
// @Failure      400            {object}  res.ErrorResponse "missing token"
// @Failure      401            {object}  res.ErrorResponse "unauthorized"
// @Failure      500            {object}  res.ErrorResponse
// @Router       /admin/session [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	token := helpers.BearerToken(r.Header.Get("Authorization"))
	if token == "" {
		res.Fail(w, r, http.StatusBadRequest, errors.New("missing token"), "missing token")
		return
	}
	if token != config.Env().AdminKey {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("invalid token"), "unauthorized")
		return
	}

	http.SetCookie(w, helpers.NewCookie("admin_token", token, adminSessionTTL))

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(loginResponse{Authenticated: true})
}
