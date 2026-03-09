package activities

import "github.com/sitcon-tw/2026-game/internal/models"

const (
	unlockIncrementCheck     = 1
	unlockIncrementBooth     = 2
	unlockIncrementChallenge = 3
)

func unlockIncrementByActivityType(activityType models.ActivitiesTypes) (int, bool) {
	switch activityType {
	case models.ActivitiesTypeCheck:
		return unlockIncrementCheck, true
	case models.ActivitiesTypeBooth:
		return unlockIncrementBooth, true
	case models.ActivitiesTypeChallenge:
		return unlockIncrementChallenge, true
	default:
		return 0, false
	}
}
