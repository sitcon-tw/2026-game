package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetUserByID fetches a user by id. Returns ErrNotFound if missing.
func (r *PGRepository) GetUserByID(ctx context.Context, tx pgx.Tx, id string) (*models.User, error) {
	const query = `
SELECT id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE id = $1`

	var u models.User
	if err := tx.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.AuthToken,
		&u.Nickname,
		&u.QRCodeToken,
		&u.CouponToken,
		&u.UnlockLevel,
		&u.CurrentLevel,
		&u.LastPassTime,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &u, nil
}

// GetUserByIDForUpdate fetches a user row with FOR UPDATE lock to avoid concurrent updates.
func (r *PGRepository) GetUserByIDForUpdate(ctx context.Context, tx pgx.Tx, id string) (*models.User, error) {
	const query = `
SELECT id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE id = $1
FOR UPDATE`

	var u models.User
	if err := tx.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.AuthToken,
		&u.Nickname,
		&u.QRCodeToken,
		&u.CouponToken,
		&u.UnlockLevel,
		&u.CurrentLevel,
		&u.LastPassTime,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &u, nil
}

// GetUserByToken fetches a user by auth token. Returns ErrNotFound if missing.
func (r *PGRepository) GetUserByToken(ctx context.Context, tx pgx.Tx, token string) (*models.User, error) {
	const query = `
SELECT id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE auth_token = $1`

	var u models.User
	if err := tx.QueryRow(ctx, query, token).Scan(
		&u.ID,
		&u.AuthToken,
		&u.Nickname,
		&u.QRCodeToken,
		&u.CouponToken,
		&u.UnlockLevel,
		&u.CurrentLevel,
		&u.LastPassTime,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &u, nil
}

// GetUserByQRCode fetches a user by their QR code token. Returns ErrNotFound if missing.
func (r *PGRepository) GetUserByQRCode(ctx context.Context, tx pgx.Tx, qr string) (*models.User, error) {
	const query = `
SELECT id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE qrcode_token = $1`

	var u models.User
	if err := tx.QueryRow(ctx, query, qr).Scan(
		&u.ID,
		&u.AuthToken,
		&u.Nickname,
		&u.QRCodeToken,
		&u.CouponToken,
		&u.UnlockLevel,
		&u.CurrentLevel,
		&u.LastPassTime,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

// IncrementUnlockLevel increases unlock_level by 1.
func (r *PGRepository) IncrementUnlockLevel(ctx context.Context, tx pgx.Tx, userID string) error {
	const stmt = `UPDATE users SET unlock_level = unlock_level + 1, updated_at = NOW() WHERE id = $1`
	_, err := tx.Exec(ctx, stmt, userID)
	return err
}

// GetUserByCouponToken fetches a user by their coupon token. Returns ErrNotFound if missing.
func (r *PGRepository) GetUserByCouponToken(ctx context.Context, tx pgx.Tx, couponToken string) (*models.User, error) {
	const query = `
SELECT id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE coupon_token = $1`

	var u models.User
	if err := tx.QueryRow(ctx, query, couponToken).Scan(
		&u.ID,
		&u.AuthToken,
		&u.Nickname,
		&u.QRCodeToken,
		&u.CouponToken,
		&u.UnlockLevel,
		&u.CurrentLevel,
		&u.LastPassTime,
		&u.CreatedAt,
		&u.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

// InsertUser inserts a new user record.
func (r *PGRepository) InsertUser(ctx context.Context, tx pgx.Tx, user *models.User) error {
	const stmt = `
INSERT INTO users (id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := tx.Exec(ctx, stmt,
		user.ID,
		user.AuthToken,
		user.Nickname,
		user.QRCodeToken,
		user.CouponToken,
		user.UnlockLevel,
		user.CurrentLevel,
		user.LastPassTime,
		user.CreatedAt,
		user.UpdatedAt,
	)
	return err
}
