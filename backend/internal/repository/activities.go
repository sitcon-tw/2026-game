package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// CountVisitedActivities returns how many activities a user has visited.
func (r *PGRepository) CountVisitedActivities(ctx context.Context, tx pgx.Tx, userID string) (int, error) {
	const query = `SELECT COUNT(*) FROM visted WHERE user_id = $1`
	var count int
	if err := tx.QueryRow(ctx, query, userID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}
