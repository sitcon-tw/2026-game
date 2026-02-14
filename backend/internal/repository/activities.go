package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/internal/models"
)

// CountVisitedActivities returns how many activities a user has visited.
func (r *PGRepository) CountVisitedActivities(ctx context.Context, tx pgx.Tx, userID string) (int, error) {
	const query = `SELECT COUNT(*) FROM visits WHERE user_id = $1`
	var count int
	if err := tx.QueryRow(ctx, query, userID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// GetActivityByQRCode fetches an activity by its QR code token.
func (r *PGRepository) GetActivityByQRCode(ctx context.Context, tx pgx.Tx, qr string) (*models.Activities, error) {
	const query = `
SELECT id, token, type, qrcode_token, name, link, description, created_at, updated_at
FROM activities
WHERE qrcode_token = $1`

	var a models.Activities
	if err := tx.QueryRow(ctx, query, qr).Scan(
		&a.ID,
		&a.Token,
		&a.Type,
		&a.QRCodeToken,
		&a.Name,
		&a.Link,
		&a.Description,
		&a.CreatedAt,
		&a.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

// GetActivityByID fetches an activity by its ID.
func (r *PGRepository) GetActivityByID(ctx context.Context, tx pgx.Tx, id string) (*models.Activities, error) {
	const query = `
SELECT id, token, type, qrcode_token, name, link, description, created_at, updated_at
FROM activities
WHERE id = $1`

	var a models.Activities
	if err := tx.QueryRow(ctx, query, id).Scan(
		&a.ID,
		&a.Token,
		&a.Type,
		&a.QRCodeToken,
		&a.Name,
		&a.Link,
		&a.Description,
		&a.CreatedAt,
		&a.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

// GetActivityByToken fetches an activity by its token.
func (r *PGRepository) GetActivityByToken(ctx context.Context, tx pgx.Tx, token string) (*models.Activities, error) {
	const query = `
SELECT id, token, type, qrcode_token, name, link, description, created_at, updated_at
FROM activities
WHERE token = $1`

	var a models.Activities
	if err := tx.QueryRow(ctx, query, token).Scan(
		&a.ID,
		&a.Token,
		&a.Type,
		&a.QRCodeToken,
		&a.Name,
		&a.Link,
		&a.Description,
		&a.CreatedAt,
		&a.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}

// CountVisitedByActivity counts visits for a specific activity.
func (r *PGRepository) CountVisitedByActivity(ctx context.Context, tx pgx.Tx, activityID string) (int, error) {
	const query = `SELECT COUNT(*) FROM visits WHERE activity_id = $1`
	var count int
	if err := tx.QueryRow(ctx, query, activityID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// AddVisited records that a user visited an activity; returns true if inserted.
func (r *PGRepository) AddVisited(ctx context.Context, tx pgx.Tx, userID, activityID string) (bool, error) {
	const stmt = `
INSERT INTO visits (user_id, activity_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id, activity_id) DO NOTHING`

	ct, err := tx.Exec(ctx, stmt, userID, activityID)
	if err != nil {
		return false, err
	}
	return ct.RowsAffected() > 0, nil
}
