package activities

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// List handles GET /activities.
// @Summary      List activities with user's check-in status
// @Description  Returns activities and whether the current user checked in.
// @Tags         activities
// @Produce      json
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/ [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	res.Fail(w, h.Logger, http.StatusInternalServerError, nil, "activities list not implemented yet")
}
