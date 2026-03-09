package activities

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
)

// issueCheckInCoupon issues a coupon when a user has visited all booth and check activities.
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

	eligibleTotal := 0
	eligibleVisited := 0
	for _, activity := range activities {
		if activity.Type != models.ActivitiesTypeBooth && activity.Type != models.ActivitiesTypeCheck {
			continue
		}

		eligibleTotal++
		if _, seen := visitedSet[activity.ID]; seen {
			eligibleVisited++
		}
	}

	if eligibleTotal == 0 || eligibleVisited != eligibleTotal {
		return nil
	}

	_, _, err = h.Repo.CreateDiscountCoupon(ctx, tx, userID, rule.Amount, rule.ID, rule.MaxQty)
	return err
}
