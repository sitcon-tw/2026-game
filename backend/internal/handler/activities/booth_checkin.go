package activities

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// BoothCheckIn handles POST /activities/booth/{userQRCode}.
// @Summary      攤位掃描使用者 QR code 打卡
// @Description  攤位工作人員使用攤位專用的 QR code 掃描器掃描使用者的 QR code，幫使用者在該攤位打卡。需要攤位的 token cookie。使用者每到一個攤位打卡，自己的 unlock_level 就會增加 1。
// @Tags         activities
// @Produce      json
// @Param        userQRCode  path      string  true  "User QR code token"
// @Success      200  {object}  checkinResponse
// @Failure      400  {object}  res.ErrorResponse "bad request"
// @Failure      401  {object}  res.ErrorResponse "unauthorized booth"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /activities/booth/{userQRCode} [post]
func (h *Handler) BoothCheckIn(w http.ResponseWriter, r *http.Request) {
	booth, ok := middleware.BoothFromContext(r.Context())
	if !ok || booth == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, nil, "unauthorized booth")
		return
	}

	userQR := chi.URLParam(r, "userQRCode")
	if userQR == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, nil, "missing user qr code")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, err := h.Repo.GetUserByQRCode(r.Context(), tx, userQR)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			res.Fail(w, h.Logger, http.StatusBadRequest, nil, "user not found")
			return
		}
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch user")
		return
	}

	inserted, err := h.Repo.AddVisited(r.Context(), tx, user.ID, booth.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to record visit")
		return
	}

	// Only reward on first-time visit.
	if inserted {
		err = h.Repo.IncrementUnlockLevel(r.Context(), tx, user.ID)
		if err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update user unlock level")
			return
		}
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	status := "already visited"
	if inserted {
		status = "visit recorded"
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(checkinResponse{Status: status})
}
