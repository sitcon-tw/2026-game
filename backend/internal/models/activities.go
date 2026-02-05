package models

import "time"

// ActivitiesTypes maps to the activities_types enum in the database.
type ActivitiesTypes string

const (
	// ActivitiesTypeBooth represents a booth activity.
	ActivitiesTypeBooth ActivitiesTypes = "booth"
	// ActivitiesTypeCheck represents a game activity.
	ActivitiesTypeCheck ActivitiesTypes = "check"
	// ActivitiesTypeChallenge represents a challenge activity.
	ActivitiesTypeChallenge ActivitiesTypes = "challenge"
)

// Activities mirrors the activities table.
type Activities struct {
	ID          string          `db:"id" json:"id"`
	Token       string          `db:"token" json:"-"`
	Type        ActivitiesTypes `db:"type" json:"type"`
	QRCodeToken string          `db:"qrcode_token" json:"qrcode_token"`
	Name        string          `db:"name" json:"name"`
	CreatedAt   time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time       `db:"updated_at" json:"updated_at"`
}
