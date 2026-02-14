package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// ListDiscountsByUser returns all coupons owned by a user ordered by created_at.
func (r *PGRepository) ListDiscountsByUser(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
) ([]models.DiscountCoupon, error) {
	const query = `
SELECT id, discount_id, user_id, price, used_by, used_at, history_id, created_at
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
			&c.UserID,
			&c.Price,
			&c.UsedBy,
			&c.UsedAt,
			&c.HistoryID,
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

// CountDiscountCouponsByDiscountIDs returns issued coupon counts keyed by discount_id.
func (r *PGRepository) CountDiscountCouponsByDiscountIDs(
	ctx context.Context,
	tx pgx.Tx,
	discountIDs []string,
) (map[string]int, error) {
	counts := make(map[string]int, len(discountIDs))
	if len(discountIDs) == 0 {
		return counts, nil
	}

	const query = `
SELECT discount_id, COUNT(*)::int
FROM discount_coupons
WHERE discount_id = ANY($1)
GROUP BY discount_id`

	rows, err := tx.Query(ctx, query, discountIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var discountID string
		var issuedQty int
		if scanErr := rows.Scan(&discountID, &issuedQty); scanErr != nil {
			return nil, scanErr
		}
		counts[discountID] = issuedQty
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return counts, nil
}

// MarkDiscountUsed sets used_at and used_by, returning the updated coupon.
func (r *PGRepository) MarkDiscountUsed(
	ctx context.Context,
	tx pgx.Tx,
	id string,
	staffID string,
) (*models.DiscountCoupon, error) {
	const stmt = `
UPDATE discount_coupons
SET used_at = NOW(), used_by = $2
WHERE id = $1
RETURNING id, discount_id, user_id, price, used_by, used_at, history_id, created_at`

	var c models.DiscountCoupon
	err := tx.QueryRow(ctx, stmt, id, staffID).Scan(
		&c.ID,
		&c.DiscountID,
		&c.UserID,
		&c.Price,
		&c.UsedBy,
		&c.UsedAt,
		&c.HistoryID,
		&c.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// ListUnusedDiscountsByUser returns all unused coupons for a user with a row-level lock.
func (r *PGRepository) ListUnusedDiscountsByUser(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
) ([]models.DiscountCoupon, error) {
	const query = `
SELECT id, discount_id, user_id, price, used_by, used_at, history_id, created_at
FROM discount_coupons
WHERE user_id = $1 AND used_at IS NULL
FOR UPDATE`

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
			&c.UserID,
			&c.Price,
			&c.UsedBy,
			&c.UsedAt,
			&c.HistoryID,
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

// MarkDiscountsUsedByUser sets used_at, used_by, and history_id for all unused coupons of a user.
func (r *PGRepository) MarkDiscountsUsedByUser(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	staffID string,
	historyID string,
	usedAt time.Time,
) ([]models.DiscountCoupon, error) {
	const stmt = `
UPDATE discount_coupons
SET used_at = $3, used_by = $2, history_id = $4
WHERE user_id = $1 AND used_at IS NULL
RETURNING id, discount_id, user_id, price, used_by, used_at, history_id, created_at`

	rows, err := tx.Query(ctx, stmt, userID, staffID, usedAt, historyID)
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
			&c.UserID,
			&c.Price,
			&c.UsedBy,
			&c.UsedAt,
			&c.HistoryID,
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
	if len(coupons) == 0 {
		return nil, ErrNotFound
	}
	return coupons, nil
}

// InsertCouponHistory records a redemption history row.
func (r *PGRepository) InsertCouponHistory(ctx context.Context, tx pgx.Tx, history *models.CouponHistory) error {
	const stmt = `
INSERT INTO coupon_histories (id, user_id, staff_id, total, used_at, created_at)
VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := tx.Exec(ctx, stmt,
		history.ID,
		history.UserID,
		history.StaffID,
		history.Total,
		history.UsedAt,
		history.CreatedAt,
	)
	return err
}

// ListCouponHistoryByStaff returns redemption history for a given staff ordered by used_at desc.
func (r *PGRepository) ListCouponHistoryByStaff(
	ctx context.Context,
	tx pgx.Tx,
	staffID string,
) ([]models.CouponHistory, error) {
	const query = `
SELECT ch.id,
       ch.user_id,
       u.nickname,
       ch.staff_id,
       ch.total,
       ch.used_at,
       ch.created_at
FROM coupon_histories ch
LEFT JOIN users u ON u.id = ch.user_id
WHERE ch.staff_id = $1
ORDER BY ch.used_at DESC`

	rows, err := tx.Query(ctx, query, staffID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []models.CouponHistory
	for rows.Next() {
		var h models.CouponHistory
		if scanErr := rows.Scan(
			&h.ID,
			&h.UserID,
			&h.Nickname,
			&h.StaffID,
			&h.Total,
			&h.UsedAt,
			&h.CreatedAt,
		); scanErr != nil {
			return nil, scanErr
		}
		histories = append(histories, h)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return histories, nil
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
INSERT INTO discount_coupons (id, discount_id, user_id, price, used_by, used_at, history_id, created_at)
VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW())
RETURNING id, discount_id, user_id, price, used_by, used_at, history_id, created_at`

	newID := uuid.NewString()

	var c models.DiscountCoupon
	err := tx.QueryRow(ctx, stmt, newID, discountID, userID, price).Scan(
		&c.ID,
		&c.DiscountID,
		&c.UserID,
		&c.Price,
		&c.UsedBy,
		&c.UsedAt,
		&c.HistoryID,
		&c.CreatedAt,
	)
	if err != nil {
		return nil, false, err
	}

	return &c, true, nil
}

// ConsumeDiscountCouponGiftByToken returns and deletes a gift coupon by token.
func (r *PGRepository) ConsumeDiscountCouponGiftByToken(
	ctx context.Context,
	tx pgx.Tx,
	token string,
) (*models.DiscountCouponGift, error) {
	const query = `
DELETE FROM discount_coupon_gift
WHERE token = $1
RETURNING id, token, price, discount_id`

	var gift models.DiscountCouponGift
	err := tx.QueryRow(ctx, query, token).Scan(
		&gift.ID,
		&gift.Token,
		&gift.Price,
		&gift.DiscountID,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &gift, nil
}

// InsertDiscountCouponForUser inserts a user coupon row.
func (r *PGRepository) InsertDiscountCouponForUser(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	price int,
	discountID string,
) (*models.DiscountCoupon, error) {
	const stmt = `
INSERT INTO discount_coupons (id, discount_id, user_id, price, used_by, used_at, history_id, created_at)
VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW())
RETURNING id, discount_id, user_id, price, used_by, used_at, history_id, created_at`

	var c models.DiscountCoupon
	err := tx.QueryRow(ctx, stmt, uuid.NewString(), discountID, userID, price).Scan(
		&c.ID,
		&c.DiscountID,
		&c.UserID,
		&c.Price,
		&c.UsedBy,
		&c.UsedAt,
		&c.HistoryID,
		&c.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &c, nil
}
