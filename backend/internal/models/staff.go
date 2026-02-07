package models

import "time"

// Staff mirrors the staff table.
//
//nolint:golines // keep struct tags aligned; lines already short
type Staff struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	Token     string    `db:"token" json:"token"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
