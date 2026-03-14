package users

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

var errUnauthorized = errors.New("unauthorized")

const defaultUnlockLevel = 5

// Login godoc
// @Summary      使用者登入
// @Description  這邊在做的事情基本上就是幫你把 token 驗證，然後把使用者丟進資料庫，接著在把這個 token 丟到 cookie 讓你不用每次都要手動帶。
// @Tags         users
// @Produce      json
// @Success      200  {object}  models.User
// @Failure      400  {object}  res.ErrorResponse "Missing token"
// @Failure      401  {object}  res.ErrorResponse "Unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Param        Authorization  header  string  true  "Bearer {token}"
// @Router       /users/session [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	token := helpers.BearerToken(r.Header.Get("Authorization"))
	if token == "" {
		err := errors.New("missing token")
		res.Fail(w, r, http.StatusBadRequest, err, "Missing token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	user, err := h.Repo.GetUserByToken(r.Context(), tx, token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			user = nil
		} else {
			res.Fail(w, r, http.StatusInternalServerError, err, "failed to query user")
			return
		}
	}

	if user == nil {
		var userID string
		userID, err = h.fetchOpassUserID(r.Context(), token)

		if errors.Is(err, errUnauthorized) {
			res.Fail(w, r, http.StatusUnauthorized, err, "Unauthorized")
			return
		}
		if err != nil {
			res.Fail(w, r, http.StatusInternalServerError, err, "failed to verify token")
			return
		}

		now := time.Now().UTC()

		user = &models.User{
			ID:           uuid.NewString(),
			AuthToken:    token,
			Nickname:     userID,
			QRCodeToken:  uuid.NewString(),
			CouponToken:  uuid.NewString(),
			UnlockLevel:  defaultUnlockLevel,
			CurrentLevel: 0,
			LastPassTime: now,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		err = h.Repo.InsertUser(r.Context(), tx, user)
		if err != nil {
			res.Fail(w, r, http.StatusInternalServerError, err, "failed to create user")
			return
		}
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	// Set session token cookie
	http.SetCookie(w, helpers.NewCookie("token", token, 30*24*time.Hour))

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(user)
}

func (h *Handler) fetchOpassUserID(ctx context.Context, authToken string) (string, error) {
	ctx, span := otel.Tracer("github.com/sitcon-tw/2026-game/users").Start(ctx, "users.fetch_opass_user_id")
	defer span.End()

	endpoint := fmt.Sprintf("%s/status?token=%s", config.Env().OPassURL, url.QueryEscape(authToken))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "build request failed")
		return "", err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "request failed")
		return "", err
	}
	defer resp.Body.Close()
	span.SetAttributes(attribute.Int("http.status_code", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		span.SetStatus(codes.Error, "unauthorized")
		return "", errUnauthorized
	}

	var payload struct {
		UserID string `json:"user_id"`
	}
	err = json.NewDecoder(resp.Body).Decode(&payload)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "decode response failed")
		return "", err
	}

	if payload.UserID == "" {
		err = errors.New("opass response missing user_id")
		span.RecordError(err)
		span.SetStatus(codes.Error, "empty user id")
		return "", err
	}

	return payload.UserID, nil
}
