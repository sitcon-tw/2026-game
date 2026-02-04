package models

import "time"

// User mirrors the users table.
type User struct {
	ID           string    `db:"id"`
	Nickname     string    `db:"nickname"`
	QRCodeToken  string    `db:"qrcode_token"`
	UnlockLevel  int       `db:"unlock_level"`
	CurrentLevel int       `db:"current_level"`
	LastPassTime time.Time `db:"last_pass_time"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
