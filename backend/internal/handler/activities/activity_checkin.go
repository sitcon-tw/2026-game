package activities

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// ActivityCheckIn handles POST /activities/{activityQRCode}.
// @Summary      使用者掃描活動 QR code 打卡
// @Description  使用者使用自己的 QR code 掃描器掃描活動的 QR code，幫自己在活動打卡。我還沒做 owo
// @Tags         activities
// @Produce      json
// @Param        activityQRCode  path      string  true  "Activity QR code token"
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/{activityQRCode} [post]
func (h *Handler) ActivityCheckIn(w http.ResponseWriter, r *http.Request) {
	res.Fail(w, h.Logger, http.StatusInternalServerError, nil, "activities check-in not implemented yet")
}
