package models

import "time"

// User mirrors the users table.
//
//nolint:golines // keep struct tags aligned; lines already short
type User struct {
	ID           string    `db:"id" json:"id"`
	AuthToken    string    `db:"auth_token" json:"-"`
	Nickname     string    `db:"nickname" json:"nickname"`
	QRCodeToken  string    `db:"qrcode_token" json:"qrcode_token"`
	CouponToken  string    `db:"coupon_token" json:"coupon_token"`
	UnlockLevel  int       `db:"unlock_level" json:"unlock_level"`
	CurrentLevel int       `db:"current_level" json:"current_level"`
	LastPassTime time.Time `db:"last_pass_time" json:"last_pass_time"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
