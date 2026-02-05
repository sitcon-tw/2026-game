package models

import "time"

// DiscountCoupon mirrors the discount_coupons table.
//
//nolint:golines // keep struct tags aligned; lines already short
type DiscountCoupon struct {
	ID         string     `db:"id" json:"id"`
	DiscountID string     `db:"discount_id" json:"discount_id"`
	Token      string     `db:"token" json:"token"`
	UserID     string     `db:"user_id" json:"user_id"`
	Price      int        `db:"price" json:"price"`
	UsedAt     *time.Time `db:"used_at" json:"used_at"`
	CreatedAt  time.Time  `db:"created_at" json:"created_at"`
}
