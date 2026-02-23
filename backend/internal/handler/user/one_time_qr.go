package users

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type oneTimeQRResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	TTL       int       `json:"ttl_seconds"`
}

// OneTimeQR godoc
// @Summary      取得一次性 QR token
// @Description  取得可供掃描使用的一次性 QR token。每 20 秒輪替，後端驗證時允許極小時間誤差。
// @Tags         users
// @Produce      json
// @Success      200  {object}  oneTimeQRResponse
// @Failure      401  {object}  res.ErrorResponse
// @Router       /users/me/one-time-qr [get]
func (h *Handler) OneTimeQR(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		err := errors.New("unauthorized")
		res.Fail(w, r, http.StatusUnauthorized, err, "Unauthorized")
		return
	}

	now := time.Now().UTC()
	resp := oneTimeQRResponse{
		Token:     helpers.BuildUserOneTimeQRToken(user.ID, user.QRCodeToken, now),
		ExpiresAt: helpers.QRTokenExpiry(now),
		TTL:       int(helpers.QRTokenTTL().Seconds()),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
