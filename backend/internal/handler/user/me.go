package user

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// Me godoc
// @Summary      Get current user profile
// @Description  Returns the authenticated user's profile data.
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
		res.Fail(w, h.Logger, http.StatusUnauthorized, err, "Unauthorized")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(user)
}
