package models

import "time"

// CouponHistory records a redemption event for one or more coupons.
//
//nolint:golines // keep tags aligned
type CouponHistory struct {
	ID        string    `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	StaffID   string    `db:"staff_id" json:"staff_id"`
	Total     int       `db:"total" json:"total"`
	UsedAt    time.Time `db:"used_at" json:"used_at"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
