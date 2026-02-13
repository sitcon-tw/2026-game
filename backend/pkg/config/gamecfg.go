package config

import (
	"sync"

	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/loader"
)

// Cached gameplay data
//
//nolint:gochecknoglobals // Package-level cache intentionally shared across calls.
var (
	levelsOnce sync.Once
	levels     []models.Level
	errLevels  error

	sheetOnce sync.Once
	sheet     []string
	errSheet  error
)

// Levels returns the parsed list of levels from the CSV path configured via env.
func Levels() ([]models.Level, error) {
	levelsOnce.Do(func() {
		levels, errLevels = loader.LoadLevels(Env().LevelCSVPath)
	})
	return levels, errLevels
}

// SheetMusic returns the ordered notes from the CSV path configured via env.
func SheetMusic() ([]string, error) {
	sheetOnce.Do(func() {
		sheet, errSheet = loader.LoadSheetMusic(Env().SheetMusicCSVPath)
	})
	return sheet, errSheet
}
