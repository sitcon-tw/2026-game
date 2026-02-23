package models

import "time"

// Announcement mirrors the announcements table.
//
//nolint:golines // Struct tags are kept on one line for readability and consistency across models.
type Announcement struct {
	ID        string    `db:"id" json:"id"`
	Content   string    `db:"content" json:"content"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
