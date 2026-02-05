package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// ListActivities returns all activities ordered by created_at then id.
func (r *PGRepository) ListActivities(ctx context.Context, tx pgx.Tx) ([]models.Activities, error) {
	const query = `
SELECT id, token, type, qrcode_token, name, created_at, updated_at
FROM activities
ORDER BY created_at ASC, id ASC`

	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Activities
	for rows.Next() {
		var a models.Activities
		err = rows.Scan(&a.ID, &a.Token, &a.Type, &a.QRCodeToken, &a.Name, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return list, nil
}

// ListVisitedActivityIDs returns activity IDs the user has visited.
func (r *PGRepository) ListVisitedActivityIDs(ctx context.Context, tx pgx.Tx, userID string) ([]string, error) {
	const query = `SELECT activity_id FROM visted WHERE user_id = $1`

	rows, err := tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		err = rows.Scan(&id)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return ids, nil
}
