package helpers

import "github.com/sitcon-tw/2026-game/pkg/config"

// FriendCapacity returns the maximum number of friends allowed based on visited activities.
// Spec: budget = (visited + 1) * 10.
func FriendCapacity(visitedActivities int) int {
	return (visitedActivities + 1) * config.Env().FriendCapacityMultiplier
}
