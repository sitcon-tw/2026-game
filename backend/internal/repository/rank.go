package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetTopUsers returns users ordered by level then last_pass_time with pagination.
func (r *PGRepository) GetTopUsers(ctx context.Context, tx pgx.Tx, limit, offset int) ([]models.User, error) {
	const query = `
SELECT nickname, current_level, last_pass_time
FROM users
ORDER BY current_level DESC, last_pass_time ASC
LIMIT $1 OFFSET $2`

	rows, err := tx.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.User
	for rows.Next() {
		var u models.User
		if scanErr := rows.Scan(&u.Nickname, &u.CurrentLevel, &u.LastPassTime); scanErr != nil {
			return nil, scanErr
		}
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

// GetUserWithRank fetches a user and their rank.
// Ranking rule: higher level first, then earlier last_pass_time.
func (r *PGRepository) GetUserWithRank(ctx context.Context, tx pgx.Tx, userID string) (*models.User, int, error) {
	const query = `
SELECT nickname, current_level, last_pass_time, rank FROM (
    SELECT id, nickname, current_level, last_pass_time,
           RANK() OVER (ORDER BY current_level DESC, last_pass_time ASC) AS rank
    FROM users
) ranked
WHERE id = $1`

	var u models.User
	var rank int
	if err := tx.QueryRow(ctx, query, userID).Scan(
		&u.Nickname,
		&u.CurrentLevel,
		&u.LastPassTime,
		&rank,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, 0, nil
		}
		return nil, 0, err
	}
	return &u, rank, nil
}

// GetAroundUsers returns users ranked within ±span of the given user.
func (r *PGRepository) GetAroundUsers(ctx context.Context, tx pgx.Tx, userID string, span int) ([]models.User, error) {
	const query = `
WITH ranked AS (
    SELECT id, nickname, current_level, last_pass_time,
           RANK() OVER (ORDER BY current_level DESC, last_pass_time ASC) AS rank
    FROM users
), my_rank AS (
    SELECT rank FROM ranked WHERE id = $1
)
SELECT nickname, current_level, last_pass_time
FROM ranked, my_rank
WHERE ranked.rank BETWEEN my_rank.rank - $2 AND my_rank.rank + $2
ORDER BY ranked.rank`

	rows, err := tx.Query(ctx, query, userID, span)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.User
	for rows.Next() {
		var u models.User
		if scanErr := rows.Scan(&u.Nickname, &u.CurrentLevel, &u.LastPassTime); scanErr != nil {
			return nil, scanErr
		}
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

// UpdateCurrentLevel sets user's current_level to newLevel and updates last_pass_time.
func (r *PGRepository) UpdateCurrentLevel(ctx context.Context, tx pgx.Tx, userID string, newLevel int) error {
	const stmt = `
UPDATE users
SET current_level = $1,
    last_pass_time = NOW(),
    updated_at = NOW()
WHERE id = $2`
	_, err := tx.Exec(ctx, stmt, newLevel, userID)
	return err
}
