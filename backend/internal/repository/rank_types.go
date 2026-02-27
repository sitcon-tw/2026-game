package repository

import "github.com/sitcon-tw/2026-game/internal/models"

// RankedUser carries leaderboard row data with computed rank.
type RankedUser struct {
	User models.User
	Rank int
}
