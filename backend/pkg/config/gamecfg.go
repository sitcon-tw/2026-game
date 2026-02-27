package config

import (
	"errors"
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

	levelInfosOnce sync.Once
	levelInfos     map[int]models.LevelInfo
	errLevelInfos  error
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

// LevelInfo returns precomputed level metadata with per-level sheet window.
func LevelInfo(level int) (models.LevelInfo, bool, error) {
	levelInfosOnce.Do(func() {
		var levelsData []models.Level
		levelsData, errLevelInfos = Levels()
		if errLevelInfos != nil {
			return
		}

		var sheetData []string
		sheetData, errLevelInfos = SheetMusic()
		if errLevelInfos != nil {
			return
		}

		levelInfos, errLevelInfos = buildLevelInfos(levelsData, sheetData)
	})
	if errLevelInfos != nil {
		return models.LevelInfo{}, false, errLevelInfos
	}

	info, ok := levelInfos[level]
	return info, ok, nil
}

func buildLevelInfos(levels []models.Level, sheet []string) (map[int]models.LevelInfo, error) {
	if len(sheet) == 0 {
		return nil, errors.New("sheet music is empty")
	}

	totalLevelCount := 0
	for _, lvl := range levels {
		if lvl.StartLevel <= 0 || lvl.EndLevel <= 0 || lvl.EndLevel < lvl.StartLevel || lvl.Speed <= 0 || lvl.Notes <= 0 {
			return nil, errors.New("invalid level config value")
		}
		totalLevelCount += lvl.EndLevel - lvl.StartLevel + 1
	}

	out := make(map[int]models.LevelInfo, totalLevelCount)
	start := 0

	for _, lvl := range levels {
		for levelNum := lvl.StartLevel; levelNum <= lvl.EndLevel; levelNum++ {
			if _, exists := out[levelNum]; exists {
				return nil, errors.New("duplicate level in config ranges")
			}

			notes := make([]string, lvl.Notes)
			for i := 0; i < lvl.Notes; i++ {
				notes[i] = sheet[(start+i)%len(sheet)]
			}

			out[levelNum] = models.LevelInfo{
				Level: levelNum,
				Speed: lvl.Speed,
				Notes: lvl.Notes,
				Sheet: notes,
			}
			start += lvl.Notes
		}
	}

	return out, nil
}
