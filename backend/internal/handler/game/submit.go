package game

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"github.com/sitcon-tw/2026-game/pkg/res"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

var errLevelExceedsUnlock = errors.New("level exceeds unlock")
var errSubmissionTooFast = errors.New("submission too fast")

const secondsPerMinute = 60

// Submit handles POST /games/submissions.
// @Summary      提交遊戲紀錄
// @Description  提交你的遊戲紀錄，會幫你把你目前的 level 提升 1 級。一樣需要 cookie 登入，需要注意的點是，當前等級不能超過解鎖等級。以及這整個是沒有任何驗證的，代表別人可以狂 call API，未來需要修個。
// @Tags         game
// @Produce      json
// @Success      200  {object}  SubmitResponse
// @Failure      400  {object}  res.ErrorResponse "current level cannot exceed unlock level"
// @Failure      429  {object}  res.ErrorResponse "submission too fast"
// @Failure      401  {object}  res.ErrorResponse "unauthorized"
// @Failure      500  {object}  res.ErrorResponse
// @Router       /games/submissions [post]
func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok || user == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("unauthorized"), "unauthorized")
		return
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	// Re-fetch latest user row to avoid stale data
	fresh, err := h.Repo.GetUserByIDForUpdate(r.Context(), tx, user.ID)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to load user")
		return
	}
	if fresh == nil {
		res.Fail(w, r, http.StatusUnauthorized, errors.New("user not found"), "unauthorized")
		return
	}

	newLevel, err := h.validateNextLevel(r.Context(), fresh)
	if err != nil {
		if errors.Is(err, errLevelExceedsUnlock) {
			res.Fail(w,
				r,
				http.StatusBadRequest,
				err,
				"current level cannot exceed unlock level",
			)
			return
		}
		if errors.Is(err, errSubmissionTooFast) {
			res.Fail(w, r, http.StatusTooManyRequests, err, "submission too fast")
			return
		}
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to validate level")
		return
	}

	err = h.Repo.UpdateCurrentLevel(r.Context(), tx, fresh.ID, newLevel)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to update level")
		return
	}

	issued, err := h.issueCoupons(r.Context(), tx, fresh.ID, newLevel)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to issue coupon")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
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

func (h *Handler) validateNextLevel(ctx context.Context, fresh *models.User) (int, error) {
	_, span := h.tracer.Start(ctx, "game.submit.validate_level")
	defer span.End()

	newLevel := fresh.CurrentLevel + 1
	span.SetAttributes(
		attribute.Int("game.current_level", fresh.CurrentLevel),
		attribute.Int("game.unlock_level", fresh.UnlockLevel),
		attribute.Int("game.next_level", newLevel),
	)

	if newLevel > fresh.UnlockLevel {
		span.SetStatus(codes.Error, "level exceeds unlock")
		return 0, errLevelExceedsUnlock
	}

	levelCfg, err := h.levelByNumber(newLevel)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "load level config failed")
		return 0, err
	}

	requiredDuration := time.Duration(levelCfg.Notes*secondsPerMinute) * time.Second / time.Duration(levelCfg.Speed)
	elapsed := time.Since(fresh.LastPassTime)
	span.SetAttributes(
		attribute.Int("game.next_level.speed", levelCfg.Speed),
		attribute.Int("game.next_level.notes", levelCfg.Notes),
		attribute.Int64("game.required_pass_ms", requiredDuration.Milliseconds()),
		attribute.Int64("game.elapsed_since_last_pass_ms", elapsed.Milliseconds()),
	)

	if elapsed < requiredDuration {
		span.SetStatus(codes.Error, "submission too fast")
		return 0, errSubmissionTooFast
	}

	return newLevel, nil
}

func (h *Handler) levelByNumber(level int) (*models.Level, error) {
	levels, err := config.Levels()
	if err != nil {
		return nil, err
	}
	for i := range levels {
		if levels[i].Level == level {
			return &levels[i], nil
		}
	}
	return nil, errors.New("level config not found")
}

func (h *Handler) issueCoupons(ctx context.Context, tx pgx.Tx, userID string, newLevel int) ([]CouponResponse, error) {
	spanCtx, span := h.tracer.Start(ctx, "game.submit.issue_coupons")
	defer span.End()

	issued := []CouponResponse{}
	for _, rule := range config.GetCouponRulesByLevel(newLevel) {
		coupon, created, err := h.Repo.CreateDiscountCoupon(
			spanCtx,
			tx,
			userID,
			rule.Amount,
			rule.ID,
			rule.MaxQty,
		)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, "issue coupon failed")
			return nil, err
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

	span.SetAttributes(attribute.Int("game.coupons.issued_count", len(issued)))
	return issued, nil
}
