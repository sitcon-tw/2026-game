package models

import "time"

// Visited tracks activities a user has visited (table: visits).
//
//nolint:golines // keep struct tags aligned; lines already short
type Visited struct {
	UserID     string    `db:"user_id" json:"user_id"`
	ActivityID string    `db:"activity_id" json:"activity_id"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}
