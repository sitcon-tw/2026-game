package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// ListAnnouncements returns all announcements ordered by newest first.
func (r *PGRepository) ListAnnouncements(ctx context.Context, tx pgx.Tx) ([]models.Announcement, error) {
	const query = `
SELECT id, content, created_at
FROM announcements
ORDER BY created_at DESC`

	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Announcement, 0)
	for rows.Next() {
		var item models.Announcement
		scanErr := rows.Scan(&item.ID, &item.Content, &item.CreatedAt)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	rowsErr := rows.Err()
	if rowsErr != nil {
		return nil, rowsErr
	}

	return items, nil
}
