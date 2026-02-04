package discount

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"github.com/sitcon-tw/2026-game/pkg/utils"
)

// DiscountUsed handles POST /discount/{couponToken}.
// @Summary      工作人員掃 QR Code 來使用折扣券
// @Description  用 QR Code 掃描器掃會眾的折價券，然後折價券就會被標記為已使用，同時返回這個折價券的詳細資訊。你要傳送 staff 的 api key 在 header 裡面才能使用這個 endpoint。
// @Tags         discount
// @Produce      json
// @Param        couponToken  path      string  true  "Discount coupon token"
// @Success      200  {object}  discountUsedResponse  ""
// @Failure      500  {object}  res.ErrorResponse
// @Failure      400  {object}  res.ErrorResponse "missing token | invalid coupon"
// @Failure      401  {object}  res.ErrorResponse "unauthorized staff"
// @Router       /discount/{couponToken} [post]
// @Param        Authorization  header  string  true  "Bearer {token}"
func (h *Handler) DiscountUsed(w http.ResponseWriter, r *http.Request) {
	token := utils.BearerToken(r.Header.Get("Authorization"))
	if token == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing token"), "missing token")
		return
	}
	if token != config.Env().StaffAPIKey {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized staff")
		return
	}

	couponToken := r.PathValue("couponToken")
	if couponToken == "" {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("missing coupon token"), "missing coupon token")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	coupon, err := h.Repo.GetDiscountByToken(r.Context(), tx, couponToken)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to fetch coupon")
		return
	}
	if coupon == nil {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("coupon not found"), "coupon not found")
		return
	}
	if !coupon.UsedAt.IsZero() {
		res.Fail(w, h.Logger, http.StatusBadRequest, errors.New("coupon already used"), "coupon already used")
		return
	}

	updated, err := h.Repo.MarkDiscountUsed(r.Context(), tx, coupon.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to mark coupon used")
		return
	}

	if err := h.Repo.CommitTransaction(r.Context(), tx); err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := discountUsedResponse{
		ID:     updated.ID,
		UserID: updated.UserID,
		Price:  updated.Price,
		UsedAt: updated.UsedAt,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

// discountUsedResponse is returned after marking a coupon as used.
type discountUsedResponse struct {
	ID     string    `json:"id"`
	UserID string    `json:"user_id"`
	Price  int       `json:"price"`
	UsedAt time.Time `json:"used_at"`
}
