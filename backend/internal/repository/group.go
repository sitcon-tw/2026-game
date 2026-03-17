package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// ListGroupMembers returns all users in the same group as the given user.
// The current user is excluded from the result.
func (r *PGRepository) ListGroupMembers(ctx context.Context, tx pgx.Tx, userID string, groupName string) ([]models.User, error) {
	const query = `
SELECT id, nickname, avatar, current_level, namecard_bio, namecard_links, namecard_email, "group"
FROM users
WHERE "group" = $1
  AND id != $2
ORDER BY created_at`

	rows, err := tx.Query(ctx, query, groupName, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if scanErr := rows.Scan(
			&u.ID,
			&u.Nickname,
			&u.Avatar,
			&u.CurrentLevel,
			&u.NamecardBio,
			&u.NamecardLinks,
			&u.NamecardEmail,
			&u.Group,
		); scanErr != nil {
			return nil, scanErr
		}
		users = append(users, u)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

// GetGroupCheckIn checks if two users have already checked in with each other.
// The pair is stored with user_a_id < user_b_id (canonical order).
func (r *PGRepository) GetGroupCheckIn(ctx context.Context, tx pgx.Tx, userIDA, userIDB string) (*models.GroupCheckIn, error) {
	a, b := canonicalPair(userIDA, userIDB)

	const query = `
SELECT user_a_id, user_b_id, created_at
FROM group_check_ins
WHERE user_a_id = $1 AND user_b_id = $2`

	var ci models.GroupCheckIn
	if err := tx.QueryRow(ctx, query, a, b).Scan(
		&ci.UserAID,
		&ci.UserBID,
		&ci.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &ci, nil
}

// InsertGroupCheckIn records a bidirectional check-in between two group members.
// Returns true if a new row was inserted (false = already checked in).
func (r *PGRepository) InsertGroupCheckIn(ctx context.Context, tx pgx.Tx, userIDA, userIDB string) (bool, error) {
	a, b := canonicalPair(userIDA, userIDB)

	const stmt = `
INSERT INTO group_check_ins (user_a_id, user_b_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT DO NOTHING`

	ct, err := tx.Exec(ctx, stmt, a, b)
	if err != nil {
		return false, err
	}
	return ct.RowsAffected() > 0, nil
}

// ListGroupCheckInsByUser returns all group_check_ins records involving a given user.
func (r *PGRepository) ListGroupCheckInsByUser(ctx context.Context, tx pgx.Tx, userID string) ([]models.GroupCheckIn, error) {
	const query = `
SELECT user_a_id, user_b_id, created_at
FROM group_check_ins
WHERE user_a_id = $1 OR user_b_id = $1`

	rows, err := tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.GroupCheckIn
	for rows.Next() {
		var ci models.GroupCheckIn
		if scanErr := rows.Scan(&ci.UserAID, &ci.UserBID, &ci.CreatedAt); scanErr != nil {
			return nil, scanErr
		}
		result = append(result, ci)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

// canonicalPair returns (a, b) where a < b (lexicographic), ensuring consistent PK ordering.
func canonicalPair(x, y string) (string, string) {
	if x < y {
		return x, y
	}
	return y, x
}
