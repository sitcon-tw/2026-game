package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetTopUsers returns users ordered by pass level, unlock level, then last_pass_time with pagination.
func (r *PGRepository) GetTopUsers(ctx context.Context, tx pgx.Tx, limit, offset int) ([]RankedUser, error) {
	const query = `
WITH ranked AS (
	    SELECT id, nickname, avatar, unlock_level, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time,
	           RANK() OVER (ORDER BY current_level DESC, unlock_level DESC, last_pass_time ASC) AS rank
	    FROM users
)
SELECT nickname, avatar, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time, rank
FROM ranked
ORDER BY current_level DESC, unlock_level DESC, last_pass_time ASC, id ASC
LIMIT $1 OFFSET $2`

	rows, err := tx.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []RankedUser
	for rows.Next() {
		var ru RankedUser
		err = rows.Scan(
			&ru.User.Nickname,
			&ru.User.Avatar,
			&ru.User.CurrentLevel,
			&ru.User.NamecardBio,
			&ru.User.NamecardLinks,
			&ru.User.NamecardEmail,
			&ru.User.LastPassTime,
			&ru.Rank,
		)
		if err != nil {
			return nil, err
		}
		out = append(out, ru)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return out, nil
}

// GetUserWithRank fetches a user and their rank.
// Ranking rule: higher pass level first, then higher unlock level, then earlier last_pass_time.
func (r *PGRepository) GetUserWithRank(ctx context.Context, tx pgx.Tx, userID string) (*models.User, int, error) {
	const query = `
SELECT nickname, avatar, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time, rank FROM (
	    SELECT id, nickname, avatar, unlock_level, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time,
	           RANK() OVER (ORDER BY current_level DESC, unlock_level DESC, last_pass_time ASC) AS rank
	    FROM users
) ranked
WHERE id = $1`

	var u models.User
	var rank int
	err := tx.QueryRow(ctx, query, userID).Scan(
		&u.Nickname,
		&u.Avatar,
		&u.CurrentLevel,
		&u.NamecardBio,
		&u.NamecardLinks,
		&u.NamecardEmail,
		&u.LastPassTime,
		&rank,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, 0, nil
		}
		return nil, 0, err
	}
	return &u, rank, nil
}

// GetAroundUsers returns users within ±span rows around the given user.
func (r *PGRepository) GetAroundUsers(ctx context.Context, tx pgx.Tx, userID string, span int) ([]RankedUser, error) {
	const query = `
WITH ranked AS (
	    SELECT id, nickname, avatar, unlock_level, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time,
	           RANK() OVER (ORDER BY current_level DESC, unlock_level DESC, last_pass_time ASC) AS rank,
	           ROW_NUMBER() OVER (ORDER BY current_level DESC, unlock_level DESC, last_pass_time ASC, id ASC) AS rn
	    FROM users
), my_row AS (
    SELECT rn FROM ranked WHERE id = $1
)
SELECT nickname, avatar, current_level, namecard_bio, namecard_links, namecard_email, last_pass_time, rank
FROM ranked, my_row
WHERE ranked.rn BETWEEN my_row.rn - $2 AND my_row.rn + $2
ORDER BY ranked.rn`

	rows, err := tx.Query(ctx, query, userID, span)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []RankedUser
	for rows.Next() {
		var ru RankedUser
		err = rows.Scan(
			&ru.User.Nickname,
			&ru.User.Avatar,
			&ru.User.CurrentLevel,
			&ru.User.NamecardBio,
			&ru.User.NamecardLinks,
			&ru.User.NamecardEmail,
			&ru.User.LastPassTime,
			&ru.Rank,
		)
		if err != nil {
			return nil, err
		}
		out = append(out, ru)
	}
	err = rows.Err()
	if err != nil {
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
