package models

import "time"

// Visited tracks activities a user has visited (table: visted).
type Visited struct {
	UserID     string    `db:"user_id"`
	ActivityID string    `db:"activity_id"`
	CreatedAt  time.Time `db:"created_at"`
}
