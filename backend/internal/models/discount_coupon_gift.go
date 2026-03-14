package models

// DiscountCouponGift mirrors the discount_coupon_gift table.
//
//nolint:golines // keep tags aligned
type DiscountCouponGift struct {
	ID         string `db:"id" json:"id"`
	Token      string `db:"token" json:"token"`
	Price      int    `db:"price" json:"price"`
	DiscountID string `db:"discount_id" json:"discount_id"`
}
