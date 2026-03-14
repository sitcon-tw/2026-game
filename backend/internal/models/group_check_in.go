package models

import "time"

// GroupCheckIn mirrors the group_check_ins table.
// It records a single bidirectional check-in between two group members.
// UserAID is always lexicographically less than UserBID (enforced by DB CHECK constraint).
//
//nolint:golines // keep struct tags aligned; lines already short
type GroupCheckIn struct {
	UserAID   string    `db:"user_a_id" json:"user_a_id"`
	UserBID   string    `db:"user_b_id" json:"user_b_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
