package activities

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
)

func (h *Handler) issueTourGroupChallengeCoupon(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	activityName string,
	activityType models.ActivitiesTypes,
) error {
	if config.IsCouponEarningStopped(time.Now().UTC()) {
		return nil
	}

	if activityType != models.ActivitiesTypeChallenge || activityName != config.TourGroupChallengeActivityName {
		return nil
	}

	rule, ok := config.GetTourGroupChallengeCouponRule()
	if !ok {
		return nil
	}

	_, _, err := h.Repo.CreateDiscountCoupon(ctx, tx, userID, rule.Amount, rule.ID)
	return err
}
