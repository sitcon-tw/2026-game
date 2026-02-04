package activities

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// BoothCheckIn handles POST /activities/booth/{userQRCode}.
// @Summary      Booth scans user's QR code
// @Description  Booth staff scans a user's QR code to check in.
// @Tags         activities
// @Produce      json
// @Param        userQRCode  path      string  true  "User QR code token"
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/booth/{userQRCode} [post]
func (h *Handler) BoothCheckIn(w http.ResponseWriter, r *http.Request) {
	res.Fail(w, h.Logger, http.StatusInternalServerError, nil, "activities booth check-in not implemented yet")
}
