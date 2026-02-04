package activities

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// ActivityCheckIn handles POST /activities/{activityQRCode}.
// @Summary      User scans activity QR code
// @Description  User checks in to an activity by scanning its QR code.
// @Tags         activities
// @Produce      json
// @Param        activityQRCode  path      string  true  "Activity QR code token"
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/{activityQRCode} [post]
func (h *Handler) ActivityCheckIn(w http.ResponseWriter, r *http.Request) {
	res.Fail(w, h.Logger, http.StatusInternalServerError, nil, "activities check-in not implemented yet")
}
