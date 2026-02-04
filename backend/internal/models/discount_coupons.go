package models

import "time"

// DiscountCoupon mirrors the discount_coupons table.
type DiscountCoupon struct {
	ID        string    `db:"id"`
	Token     string    `db:"token"`
	UserID    string    `db:"user_id"`
	Price     int       `db:"price"`
	UsedAt    time.Time `db:"used_at"`
	CreatedAt time.Time `db:"created_at"`
}
