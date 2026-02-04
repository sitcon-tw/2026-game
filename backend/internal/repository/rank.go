package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetLeaderboard returns top 10, around ±5 of the user, and the user itself.
// Ranking rule: higher level first, then earlier last_pass_time.
func (r *PGRepository) GetLeaderboard(ctx context.Context, tx pgx.Tx, userID string) (top10 []models.RankRow, around []models.RankRow, me *models.RankRow, err error) {
	// Common ORDER BY
	order := "ORDER BY current_level DESC, last_pass_time ASC"

	// Top 10
	const topQuery = `
SELECT nickname, current_level AS level, rank
FROM (
    SELECT nickname, current_level, last_pass_time,
           RANK() OVER (ORDER BY current_level DESC, last_pass_time ASC) AS rank
    FROM users
) ranked
` // ORDER BY appended below

	topSQL := topQuery + " " + order + " LIMIT 10"
	if rows, qerr := tx.Query(ctx, topSQL); qerr != nil {
		return nil, nil, nil, qerr
	} else {
		defer rows.Close()
		for rows.Next() {
			var e models.RankRow
			if scanErr := rows.Scan(&e.Nickname, &e.Level, &e.Rank); scanErr != nil {
				return nil, nil, nil, scanErr
			}
			top10 = append(top10, e)
		}
		if rowsErr := rows.Err(); rowsErr != nil {
			return nil, nil, nil, rowsErr
		}
	}

	// User rank
	const meQuery = `
SELECT nickname, current_level AS level, rank FROM (
    SELECT id, nickname, current_level, last_pass_time,
           RANK() OVER (ORDER BY current_level DESC, last_pass_time ASC) AS rank
    FROM users
) ranked
WHERE id = $1`
	var m models.RankRow
	if qerr := tx.QueryRow(ctx, meQuery, userID).Scan(&m.Nickname, &m.Level, &m.Rank); qerr != nil {
		if qerr == pgx.ErrNoRows {
			return top10, nil, nil, nil
		}
		return nil, nil, nil, qerr
	}
	me = &m

	// ±5 around the user rank (including user)
	const aroundQuery = `
WITH ranked AS (
    SELECT id, nickname, current_level, last_pass_time,
           RANK() OVER (ORDER BY current_level DESC, last_pass_time ASC) AS rank
    FROM users
), my_rank AS (
    SELECT rank FROM ranked WHERE id = $1
)
SELECT nickname, current_level AS level, rank
FROM ranked, my_rank
WHERE ranked.rank BETWEEN my_rank.rank - 5 AND my_rank.rank + 5
` // ORDER BY appended below

	aroundSQL := aroundQuery + " " + order
	if rows, qerr := tx.Query(ctx, aroundSQL, userID); qerr != nil {
		return nil, nil, nil, qerr
	} else {
		defer rows.Close()
		for rows.Next() {
			var e models.RankRow
			if scanErr := rows.Scan(&e.Nickname, &e.Level, &e.Rank); scanErr != nil {
				return nil, nil, nil, scanErr
			}
			around = append(around, e)
		}
		if rowsErr := rows.Err(); rowsErr != nil {
			return nil, nil, nil, rowsErr
		}
	}

	return top10, around, me, nil
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
