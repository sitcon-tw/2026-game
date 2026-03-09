package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/helpers"
)

// CreateDiscountCouponGift inserts a gift coupon row with generated id/token.
func (r *PGRepository) CreateDiscountCouponGift(
	ctx context.Context,
	tx pgx.Tx,
	price int,
	discountID string,
) (*models.DiscountCouponGift, error) {
	const stmt = `
INSERT INTO discount_coupon_gift (id, token, price, discount_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (token) DO NOTHING
RETURNING id, token, price, discount_id`

	const (
		tokenLength = 8
		maxAttempts = 5
	)

	for range maxAttempts {
		token, err := helpers.RandomAlphabetToken(tokenLength)
		if err != nil {
			return nil, err
		}

		gift := models.DiscountCouponGift{
			ID:         uuid.NewString(),
			Token:      token,
			Price:      price,
			DiscountID: discountID,
		}

		if err = tx.QueryRow(ctx, stmt, gift.ID, gift.Token, gift.Price, gift.DiscountID).Scan(
			&gift.ID,
			&gift.Token,
			&gift.Price,
			&gift.DiscountID,
		); err == nil {
			return &gift, nil
		}

		if errors.Is(err, pgx.ErrNoRows) {
			continue
		}

		return nil, err
	}

	return nil, errors.New("failed to generate unique gift coupon token")
}

// DeleteDiscountCouponGiftByID deletes gift coupon by id.
func (r *PGRepository) DeleteDiscountCouponGiftByID(ctx context.Context, tx pgx.Tx, id string) error {
	const stmt = `DELETE FROM discount_coupon_gift WHERE id = $1`

	tag, err := tx.Exec(ctx, stmt, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

// ListDiscountCouponGifts returns all gift coupons.
func (r *PGRepository) ListDiscountCouponGifts(ctx context.Context, tx pgx.Tx) ([]models.DiscountCouponGift, error) {
	const query = `
SELECT id, token, price, discount_id
FROM discount_coupon_gift
ORDER BY id ASC`

	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	gifts := []models.DiscountCouponGift{}
	for rows.Next() {
		var gift models.DiscountCouponGift
		if scanErr := rows.Scan(&gift.ID, &gift.Token, &gift.Price, &gift.DiscountID); scanErr != nil {
			return nil, scanErr
		}
		gifts = append(gifts, gift)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}
	return gifts, nil
}

// SearchUsersByNickname finds users by nickname full-text and partial match.
func (r *PGRepository) SearchUsersByNickname(
	ctx context.Context,
	tx pgx.Tx,
	query string,
	limit int,
) ([]models.User, error) {
	q := strings.TrimSpace(query)
	if q == "" {
		return []models.User{}, nil
	}

	const stmt = `
SELECT id, auth_token, nickname, avatar, qrcode_token, coupon_token, "group", unlock_level, current_level, last_pass_time, created_at, updated_at
FROM users
WHERE to_tsvector('simple', COALESCE(nickname, '')) @@ websearch_to_tsquery('simple', $1)
   OR nickname ILIKE '%' || $1 || '%'
ORDER BY ts_rank_cd(to_tsvector('simple', COALESCE(nickname, '')), websearch_to_tsquery('simple', $1)) DESC,
         nickname ASC
LIMIT $2`

	rows, err := tx.Query(ctx, stmt, q, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if scanErr := rows.Scan(
			&u.ID,
			&u.AuthToken,
			&u.Nickname,
			&u.Avatar,
			&u.QRCodeToken,
			&u.CouponToken,
			&u.Group,
			&u.UnlockLevel,
			&u.CurrentLevel,
			&u.LastPassTime,
			&u.CreatedAt,
			&u.UpdatedAt,
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

// TryMarkAdminScanCouponIssued marks scan issuance once per user+discount.
// Returns true when marked, false when already marked before.
func (r *PGRepository) TryMarkAdminScanCouponIssued(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	discountID string,
) (bool, error) {
	const stmt = `
INSERT INTO admin_qr_coupon_grants (user_id, discount_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id, discount_id) DO NOTHING`

	tag, err := tx.Exec(ctx, stmt, userID, discountID)
	if err != nil {
		return false, err
	}

	return tag.RowsAffected() == 1, nil
}
