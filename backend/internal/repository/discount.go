package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetDiscountByToken fetches a discount coupon by its token.
func (r *PGRepository) GetDiscountByToken(
	ctx context.Context,
	tx pgx.Tx,
	token string,
) (*models.DiscountCoupon, error) {
	const query = `
SELECT id, discount_id, token, user_id, price, used_at, created_at
FROM discount_coupons
WHERE token = $1
FOR UPDATE`

	var c models.DiscountCoupon
	if err := tx.QueryRow(ctx, query, token).Scan(
		&c.ID,
		&c.DiscountID,
		&c.Token,
		&c.UserID,
		&c.Price,
		&c.UsedAt,
		&c.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &c, nil
}

// ListDiscountsByUser returns all coupons owned by a user ordered by created_at.
func (r *PGRepository) ListDiscountsByUser(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
) ([]models.DiscountCoupon, error) {
	const query = `
SELECT id, discount_id, token, user_id, price, used_at, created_at
FROM discount_coupons
WHERE user_id = $1
ORDER BY created_at ASC`

	rows, err := tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []models.DiscountCoupon
	for rows.Next() {
		var c models.DiscountCoupon
		if scanErr := rows.Scan(
			&c.ID,
			&c.DiscountID,
			&c.Token,
			&c.UserID,
			&c.Price,
			&c.UsedAt,
			&c.CreatedAt,
		); scanErr != nil {
			return nil, scanErr
		}
		coupons = append(coupons, c)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return coupons, nil
}

// MarkDiscountUsed sets used_at to NOW() and returns the updated coupon.
func (r *PGRepository) MarkDiscountUsed(ctx context.Context, tx pgx.Tx, id string) (*models.DiscountCoupon, error) {
	const stmt = `
UPDATE discount_coupons
SET used_at = NOW()
WHERE id = $1
RETURNING id, discount_id, token, user_id, price, used_at, created_at`

	var c models.DiscountCoupon
	if err := tx.QueryRow(ctx, stmt, id).Scan(
		&c.ID,
		&c.DiscountID,
		&c.Token,
		&c.UserID,
		&c.Price,
		&c.UsedAt,
		&c.CreatedAt,
	); err != nil {
		return nil, err
	}
	return &c, nil
}

// CreateDiscountCoupon inserts a new discount coupon row for a user if global MaxQty not exceeded.
// Returns (coupon, true, nil) when created; (nil, false, nil) when quota reached.
func (r *PGRepository) CreateDiscountCoupon(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	price int,
	discountID string,
	maxQty int,
) (*models.DiscountCoupon, bool, error) {
	// Advisory lock to serialize issuance per discountID and avoid race on MaxQty.
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, discountID); err != nil {
		return nil, false, err
	}

	const countQuery = `SELECT COUNT(*) FROM discount_coupons WHERE discount_id = $1`
	var cnt int
	if err := tx.QueryRow(ctx, countQuery, discountID).Scan(&cnt); err != nil {
		return nil, false, err
	}
	if cnt >= maxQty {
		return nil, false, nil
	}

	const stmt = `
INSERT INTO discount_coupons (id, discount_id, token, user_id, price, used_at, created_at)
VALUES ($1, $2, $3, $4, $5, NULL, NOW())
RETURNING id, discount_id, token, user_id, price, used_at, created_at`

	newID := uuid.NewString()
	newToken := uuid.NewString()

	var c models.DiscountCoupon
	if err := tx.QueryRow(ctx, stmt, newID, discountID, newToken, userID, price).Scan(
		&c.ID,
		&c.DiscountID,
		&c.Token,
		&c.UserID,
		&c.Price,
		&c.UsedAt,
		&c.CreatedAt,
	); err != nil {
		return nil, false, err
	}

	return &c, true, nil
}
