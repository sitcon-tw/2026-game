package activities

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"github.com/sitcon-tw/2026-game/pkg/utils"
)

// BoothLogin handles POST /activities/booth/login.
// @Summary      攤位登入
// @Description  攤位使用此 API 登入系統，成功後會在 cookie 設定 booth_token，之後攤位就可以使用此 cookie 來辨識自己身份。來使用 /activities/booth/ 底下的功能。
// @Tags         activities
// @Produce      json
// @Success      200  {string}  string  ""
// @Failure      400  {object}  res.ErrorResponse "missing token"
// @Failure      401  {object}  res.ErrorResponse "unauthorized booth"
// @Failure      500  {object}  res.ErrorResponse
// @Param        Authorization  header  string  true  "Bearer {token}"
// @Router       /activities/booth/login [post]
func (h *Handler) BoothLogin(w http.ResponseWriter, r *http.Request) {
	token := utils.BearerToken(r.Header.Get("Authorization"))
	if token == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing token"), "missing token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	booth, err := h.requireBoothByID(r.Context(), tx, token)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, err, "unauthorized booth")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "booth_token",
		Value:    booth.ID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   config.Env().AppEnv == config.AppEnvProd,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
	})

	w.WriteHeader(http.StatusOK)
}

// requireBooth loads the activity by qr token and ensures type=booth.
func (h *Handler) requireBoothByID(ctx context.Context, tx pgx.Tx, id string) (*models.Activities, error) {
	booth, err := h.Repo.GetActivityByID(ctx, tx, id)
	if err != nil {
		return nil, err
	}
	if booth == nil || booth.Type != models.BoothTypeBooth {
		return nil, errors.New("booth not found")
	}
	return booth, nil
}
