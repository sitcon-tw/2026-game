package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// GetStaffByToken finds a staff by token for authentication.
func (r *PGRepository) GetStaffByToken(ctx context.Context, tx pgx.Tx, token string) (*models.Staff, error) {
	const query = `
SELECT id, name, token, created_at, updated_at
FROM staffs
WHERE token = $1
FOR UPDATE`

	var s models.Staff
	if err := tx.QueryRow(ctx, query, token).Scan(
		&s.ID,
		&s.Name,
		&s.Token,
		&s.CreatedAt,
		&s.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

// TryMarkStaffScanCouponIssued marks scan issuance once per user+discount (by a staff member).
// Returns true when newly inserted, false when already issued.
func (r *PGRepository) TryMarkStaffScanCouponIssued(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	discountID string,
	staffID string,
) (bool, error) {
	const stmt = `
INSERT INTO staff_qr_coupon_grants (user_id, discount_id, staff_id, created_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (user_id, discount_id) DO NOTHING`

	tag, err := tx.Exec(ctx, stmt, userID, discountID, staffID)
	if err != nil {
		return false, err
	}

	return tag.RowsAffected() == 1, nil
}

// ListStaffScanCouponGrants returns all QR-scan coupon grants performed by a given staff member.
func (r *PGRepository) ListStaffScanCouponGrants(
	ctx context.Context,
	tx pgx.Tx,
	staffID string,
) ([]models.StaffQRCouponGrant, error) {
	const query = `
SELECT g.user_id,
       u.nickname,
       g.discount_id,
       g.staff_id,
       g.created_at
FROM staff_qr_coupon_grants g
LEFT JOIN users u ON u.id = g.user_id
WHERE g.staff_id = $1
ORDER BY g.created_at DESC`

	rows, err := tx.Query(ctx, query, staffID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grants []models.StaffQRCouponGrant
	for rows.Next() {
		var g models.StaffQRCouponGrant
		if scanErr := rows.Scan(
			&g.UserID,
			&g.Nickname,
			&g.DiscountID,
			&g.StaffID,
			&g.CreatedAt,
		); scanErr != nil {
			return nil, scanErr
		}
		grants = append(grants, g)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return grants, nil
}
