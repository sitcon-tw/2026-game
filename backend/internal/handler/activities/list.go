package activities

import (
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/res"
)

// List handles GET /activities.
// @Summary      取得活動列表與使用者打卡狀態
// @Description  取得活動列表跟使用者在每個攤位、打卡、挑戰的狀態。我還沒做 owo
// @Tags         activities
// @Produce      json
// @Success      200  {string}  string  ""
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/ [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	res.Fail(w, h.Logger, http.StatusInternalServerError, nil, "activities list not implemented yet")
}
