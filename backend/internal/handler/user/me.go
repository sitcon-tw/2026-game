package users

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// Me godoc
// @Summary      取得使用者資料
// @Description  取得目前登入使用者的資料，需要登入後才能取得。會取得包括目前的 level、解鎖多少 level、QR code token 等等資訊。備註：要取得 QR code token 就是用這邊。
// @Tags         users
// @Produce      json
// @Success      200  {object}  models.User
// @Failure      401  {object}  res.ErrorResponse
// @Failure      500  {object}  res.ErrorResponse
// @Router       /users/me [get]
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		err := errors.New("unauthorized")
		res.Fail(w, r, http.StatusUnauthorized, err, "Unauthorized")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(user)
}
