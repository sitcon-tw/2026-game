package users

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"net/url"
	"strings"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

const (
	maxNamecardBioLength   = 500
	maxNamecardLinksCount  = 20
	maxNamecardLinkLength  = 500
	maxNamecardEmailLength = 254
)

type updateNamecardRequest struct {
	Bio   *string   `json:"bio"`
	Links *[]string `json:"links"`
	Email *string   `json:"email"`
}

// UpdateNamecard godoc
// @Summary      更新使用者名牌
// @Description  更新目前使用者的公開名牌資訊（自我介紹、連結陣列、Email）。需要登入。
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        request  body      updateNamecardRequest  true  "Namecard payload"
// @Success      200  {object}  models.PublicUser
// @Failure      400  {object}  res.ErrorResponse "invalid request"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /users/me/namecard [patch]
func (h *Handler) UpdateNamecard(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := middleware.UserFromContext(r.Context())
	if !ok || currentUser == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	var req updateNamecardRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid request body")
		return
	}

	bio, bioProvided, err := normalizeNamecardText(req.Bio, maxNamecardBioLength, "bio")
	if err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid bio")
		return
	}
	email, emailProvided, err := normalizeNamecardEmail(req.Email)
	if err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid email")
		return
	}
	links, linksProvided, err := normalizeNamecardLinks(req.Links)
	if err != nil {
		res.Fail(w, r, http.StatusBadRequest, err, "invalid links")
		return
	}

	if !bioProvided {
		bio = currentUser.NamecardBio
	}
	if !emailProvided {
		email = currentUser.NamecardEmail
	}
	if !linksProvided {
		links = currentUser.NamecardLinks
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	avatar := buildNamecardAvatar(email)

	err = h.Repo.UpdateUserNamecard(r.Context(), tx, currentUser.ID, bio, links, email, avatar)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to update namecard")
		return
	}

	updatedUser, err := h.Repo.GetUserByID(r.Context(), tx, currentUser.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to fetch updated user")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(models.ToPublicUser(*updatedUser))
}

func normalizeNamecardText(raw *string, maxLength int, field string) (*string, bool, error) {
	if raw == nil {
		return nil, false, nil
	}
	text := strings.TrimSpace(*raw)
	if text == "" {
		return nil, true, nil
	}
	if len(text) > maxLength {
		return nil, true, errors.New(field + " is too long")
	}
	return &text, true, nil
}

func normalizeNamecardEmail(raw *string) (*string, bool, error) {
	email, provided, err := normalizeNamecardText(raw, maxNamecardEmailLength, "email")
	if err != nil || email == nil {
		return email, provided, err
	}
	if _, err = mail.ParseAddress(*email); err != nil {
		return nil, true, errors.New("email format is invalid")
	}
	return email, true, nil
}

func normalizeNamecardLinks(raw *[]string) ([]string, bool, error) {
	if raw == nil {
		return nil, false, nil
	}
	if len(*raw) > maxNamecardLinksCount {
		return nil, true, errors.New("too many links")
	}

	links := make([]string, 0, len(*raw))
	for _, link := range *raw {
		trimmed := strings.TrimSpace(link)
		if trimmed == "" {
			continue
		}
		if len(trimmed) > maxNamecardLinkLength {
			return nil, true, errors.New("link is too long")
		}
		parsed, err := url.ParseRequestURI(trimmed)
		if err != nil || parsed == nil {
			return nil, true, errors.New("link format is invalid")
		}
		if parsed.Scheme != "http" && parsed.Scheme != "https" {
			return nil, true, errors.New("link must use http or https")
		}
		if parsed.Host == "" {
			return nil, true, errors.New("link format is invalid")
		}
		links = append(links, trimmed)
	}

	return links, true, nil
}

func buildNamecardAvatar(email *string) *string {
	if email == nil {
		return nil
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(*email))
	if normalizedEmail == "" {
		return nil
	}

	hash := sha256.Sum256([]byte(normalizedEmail))
	avatar := "https://www.gravatar.com/avatar/" + hex.EncodeToString(hash[:]) + "?s=200&d=robohash"
	return &avatar
}
