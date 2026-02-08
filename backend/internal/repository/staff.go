package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetStaffByToken finds a staff by token for authentication.
func (r *PGRepository) GetStaffByToken(ctx context.Context, tx pgx.Tx, token string) (*models.Staff, error) {
const query = `
SELECT id, name, token, created_at, updated_at
FROM staffs
WHERE token = $1
FOR UPDATE`

	var s models.Staff
	if err := tx.QueryRow(ctx, query, token).Scan(
		&s.ID,
		&s.Name,
		&s.Token,
		&s.CreatedAt,
		&s.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}
