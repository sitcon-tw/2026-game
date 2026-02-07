package game

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

// Submit handles POST /game.
// @Summary      提交遊戲紀錄
// @Description  提交你的遊戲紀錄，會幫你把你目前的 level 提升 1 級。一樣需要 cookie 登入，需要注意的點是，當前等級不能超過解鎖等級。以及這整個是沒有任何驗證的，代表別人可以狂 call API，未來需要修個。
// @Tags         game
// @Produce      json
// @Success      200  {object}  SubmitResponse
// @Failure      400  {object}  res.ErrorResponse "current level cannot exceed unlock level"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /game [post]
func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	// Re-fetch latest user row to avoid stale data
	fresh, err := h.Repo.GetUserByIDForUpdate(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to load user")
		return
	}
	if fresh == nil {
		res.Fail(w, h.Logger, http.StatusUnauthorized, errors.New("user not found"), "unauthorized")
		return
	}

	// Increment current level by 1 but do not exceed unlock_level
	newLevel := fresh.CurrentLevel + 1
	if newLevel > fresh.UnlockLevel {
		res.Fail(
			w,
			h.Logger,
			http.StatusBadRequest,
			errors.New("level exceeds unlock"),
			"current level cannot exceed unlock level",
		)
		return
	}

	err = h.Repo.UpdateCurrentLevel(r.Context(), tx, fresh.ID, newLevel)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to update level")
		return
	}

	// Issue discount coupons for newly reached levels based on rules.
	issued := []CouponResponse{}
	var (
		coupon  *models.DiscountCoupon
		created bool
	)
	for _, rule := range config.GetCouponRulesByLevel(newLevel) {
		coupon, created, err = h.Repo.CreateDiscountCoupon(
			r.Context(),
			tx,
			fresh.ID,
			rule.Amount,
			rule.ID,
			rule.MaxQty,
		)
		if err != nil {
			res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to issue coupon")
			return
		}
		if !created {
			continue
		}

		issued = append(issued, CouponResponse{
			ID:         coupon.ID,
			Price:      coupon.Price,
			DiscountID: coupon.DiscountID,
		})
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, h.Logger, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := SubmitResponse{
		CurrentLevel: newLevel,
		UnlockLevel:  fresh.UnlockLevel,
		Coupons:      issued,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
