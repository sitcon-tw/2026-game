package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// CountFriends returns how many friends a user currently has.
func (r *PGRepository) CountFriends(ctx context.Context, tx pgx.Tx, userID string) (int, error) {
	const query = `SELECT COUNT(*) FROM friends WHERE user_id = $1`
	var count int
	if err := tx.QueryRow(ctx, query, userID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// AddFriend inserts a friend relation (directional). Returns true if a row was inserted.
func (r *PGRepository) AddFriend(ctx context.Context, tx pgx.Tx, userID, friendID string) (bool, error) {
	const stmt = `INSERT INTO friends (user_id, friend_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`
	ct, err := tx.Exec(ctx, stmt, userID, friendID)
	if err != nil {
		return false, err
	}
	return ct.RowsAffected() > 0, nil
}

// ListFriends returns user profiles of all friends for a user.
func (r *PGRepository) ListFriends(ctx context.Context, tx pgx.Tx, userID string) ([]models.User, error) {
	const query = `
SELECT u.id, u.nickname, u.qrcode_token, u.unlock_level, u.current_level, u.last_pass_time, u.created_at, u.updated_at
FROM friends f
JOIN users u ON u.id = f.friend_id
WHERE f.user_id = $1
ORDER BY u.created_at`

	rows, err := tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(
			&u.ID,
			&u.Nickname,
			&u.QRCodeToken,
			&u.UnlockLevel,
			&u.CurrentLevel,
			&u.LastPassTime,
			&u.CreatedAt,
			&u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}
