package models

import "time"

// ActivitiesTypes maps to the activities_types enum in the database.
type ActivitiesTypes string

const (
	BoothTypeBooth     ActivitiesTypes = "booth"
	BoothTypeCheck     ActivitiesTypes = "check"
	BoothTypeChallenge ActivitiesTypes = "challenge"
)

// Activities mirrors the activities table.
type Activities struct {
	ID          string          `db:"id"`
	Type        ActivitiesTypes `db:"type"`
	QRCodeToken string          `db:"qrcode_token"`
	Name        string          `db:"name"`
	CreatedAt   time.Time       `db:"created_at"`
	UpdatedAt   time.Time       `db:"updated_at"`
}
