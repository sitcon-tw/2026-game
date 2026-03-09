package models

import "time"

// StaffQRCouponGrant records a coupon issued by a staff member via QR code scan
// (table: staff_qr_coupon_grants).
type StaffQRCouponGrant struct {
	UserID     string    `db:"user_id"     json:"user_id"`
	Nickname   string    `db:"nickname"    json:"nickname"`
	DiscountID string    `db:"discount_id" json:"discount_id"`
	StaffID    string    `db:"staff_id"    json:"staff_id"`
	CreatedAt  time.Time `db:"created_at"  json:"created_at"`
}
