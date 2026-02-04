package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

var errUnauthorized = errors.New("unauthorized")

// Login godoc
// @Summary      Login user
// @Description  Initiates login flow and issues session cookie.
// @Tags         users
// @Produce      json
// @Success      200  {object}  models.User
// @Failure      400  {object}  res.ErrorResponse "Missing token"
// @Failure      401  {object}  res.ErrorResponse "Inauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Param        Authorization  header  string  true  "Bearer {token}"
// @Router       /users/login [get]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	token := bearerToken(r.Header.Get("Authorization"))
	if token == "" {
		err := errors.New("missing token")
		res.Fail(w, h.Logger, http.StatusBadRequest, err, "Missing token")
		return
	}

	userID, err := h.fetchOpassUserID(r.Context(), token)
	if errors.Is(err, errUnauthorized) {
		res.Fail(w, h.Logger, http.StatusUnauthorized, err, "Unauthorized")
		return
	}
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to verify token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, err := h.Repo.GetUserByID(r.Context(), tx, token)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to query user")
		return
	}

	if user == nil {
		now := time.Now().UTC()

		user = &models.User{
			ID:           token,
			Nickname:     userID,
			QRCodeToken:  uuid.NewString(),
			UnlockLevel:  5,
			CurrentLevel: 1,
			LastPassTime: now,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		if err := h.Repo.InsertUser(r.Context(), tx, user); err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to create user")
			return
		}
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	// Set session token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   config.Env().AppEnv == config.AppEnvProd,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
	})

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(user)
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if header == "" {
		return ""
	}
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}

func (h *Handler) fetchOpassUserID(ctx context.Context, authToken string) (string, error) {
	endpoint := fmt.Sprintf("%s/status?token=%s", config.Env().OPassURL, url.QueryEscape(authToken))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return "", err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errUnauthorized
	}

	var payload struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", err
	}

	if payload.UserID == "" {
		return "", errors.New("opass response missing user_id")
	}

	return payload.UserID, nil
}
