package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetDiscountByToken fetches a discount coupon by its token.
func (r *PGRepository) GetDiscountByToken(ctx context.Context, tx pgx.Tx, token string) (*models.DiscountCoupon, error) {
	const query = `
SELECT id, token, user_id, price, used_at, created_at
FROM discount_coupons
WHERE token = $1
FOR UPDATE`

	var c models.DiscountCoupon
	if err := tx.QueryRow(ctx, query, token).Scan(
		&c.ID,
		&c.Token,
		&c.UserID,
		&c.Price,
		&c.UsedAt,
		&c.CreatedAt,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

// MarkDiscountUsed sets used_at to NOW() and returns the updated coupon.
func (r *PGRepository) MarkDiscountUsed(ctx context.Context, tx pgx.Tx, id string) (*models.DiscountCoupon, error) {
	const stmt = `
UPDATE discount_coupons
SET used_at = NOW()
WHERE id = $1
RETURNING id, token, user_id, price, used_at, created_at`

	var c models.DiscountCoupon
	if err := tx.QueryRow(ctx, stmt, id).Scan(
		&c.ID,
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
