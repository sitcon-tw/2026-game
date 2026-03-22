package activities

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
)

const checkInCouponThreshold = 23

// issueCheckInCoupon issues a coupon when a user has visited at least 23 booth/check activities.
func (h *Handler) issueCheckInCoupon(ctx context.Context, tx pgx.Tx, userID string) error {
	rule, ok := config.GetCheckInCompletionCouponRule()
	if !ok {
		return nil
	}

	activities, err := h.Repo.ListActivities(ctx, tx)
	if err != nil {
		return err
	}

	visitedIDs, err := h.Repo.ListVisitedActivityIDs(ctx, tx, userID)
	if err != nil {
		return err
	}

	visitedSet := make(map[string]struct{}, len(visitedIDs))
	for _, id := range visitedIDs {
		visitedSet[id] = struct{}{}
	}

	eligibleVisited := 0
	for _, activity := range activities {
		if activity.Type != models.ActivitiesTypeBooth && activity.Type != models.ActivitiesTypeCheck {
			continue
		}

		if _, seen := visitedSet[activity.ID]; seen {
			eligibleVisited++
		}
	}

	if eligibleVisited < checkInCouponThreshold {
		return nil
	}

	_, created, err := h.Repo.CreateDiscountCoupon(ctx, tx, userID, rule.Amount, rule.ID)
	if err != nil {
		return err
	}
	if !created {
		return nil
	}

	return nil
}
