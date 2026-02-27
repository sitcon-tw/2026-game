package loader

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/sitcon-tw/2026-game/internal/models"
)

const minLevelColumns = 3

// LoadLevels reads level configuration from a CSV file (data/level.csv).
func LoadLevels(path string) ([]models.Level, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open level csv: %w", err)
	}
	defer f.Close()

	r := csv.NewReader(f)

	header, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("read header: %w", err)
	}
	if len(header) < minLevelColumns {
		return nil, fmt.Errorf("level csv has %d columns, want at least %d", len(header), minLevelColumns)
	}

	levels := []models.Level{}

	for {
		row, readErr := r.Read()
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return nil, fmt.Errorf("read row: %w", readErr)
		}
		if len(row) < minLevelColumns {
			return nil, fmt.Errorf("row has %d columns, want at least %d", len(row), minLevelColumns)
		}

		// New format: level_start, level_end, speed, notes.
		if len(row) >= 4 {
			levelStart, convErr := strconv.Atoi(strings.TrimSpace(row[0]))
			if convErr != nil {
				return nil, fmt.Errorf("parse level start %q: %w", row[0], convErr)
			}
			levelEnd, convErr := strconv.Atoi(strings.TrimSpace(row[1]))
			if convErr != nil {
				return nil, fmt.Errorf("parse level end %q: %w", row[1], convErr)
			}
			speed, convErr := strconv.Atoi(strings.TrimSpace(row[2]))
			if convErr != nil {
				return nil, fmt.Errorf("parse speed %q: %w", row[2], convErr)
			}
			notes, convErr := strconv.Atoi(strings.TrimSpace(row[3]))
			if convErr != nil {
				return nil, fmt.Errorf("parse notes %q: %w", row[3], convErr)
			}
			if levelStart <= 0 || levelEnd <= 0 || levelEnd < levelStart {
				return nil, fmt.Errorf("invalid level range: start=%d end=%d", levelStart, levelEnd)
			}
			if speed <= 0 || notes <= 0 {
				return nil, fmt.Errorf("invalid speed/notes: speed=%d notes=%d", speed, notes)
			}

			levels = append(levels, models.Level{
				StartLevel: levelStart,
				EndLevel:   levelEnd,
				Speed:      speed,
				Notes:      notes,
			})
			continue
		}

		// Legacy format: level, speed, notes.
		lvl, convErr := strconv.Atoi(strings.TrimSpace(row[0]))
		if convErr != nil {
			return nil, fmt.Errorf("parse level %q: %w", row[0], convErr)
		}
		speed, convErr := strconv.Atoi(strings.TrimSpace(row[1]))
		if convErr != nil {
			return nil, fmt.Errorf("parse speed %q: %w", row[1], convErr)
		}
		notes, convErr := strconv.Atoi(strings.TrimSpace(row[2]))
		if convErr != nil {
			return nil, fmt.Errorf("parse notes %q: %w", row[2], convErr)
		}
		if lvl <= 0 || speed <= 0 || notes <= 0 {
			return nil, fmt.Errorf("invalid level row: level=%d speed=%d notes=%d", lvl, speed, notes)
		}

		levels = append(levels, models.Level{
			StartLevel: lvl,
			EndLevel:   lvl,
			Speed:      speed,
			Notes:      notes,
		})
	}

	return levels, nil
}

// LoadSheetMusic reads a list of note names from a one-column CSV (data/sheet_music.csv).
func LoadSheetMusic(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open sheet music csv: %w", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	notes := []string{}

	for {
		row, readErr := r.Read()
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return nil, fmt.Errorf("read row: %w", readErr)
		}
		if len(row) == 0 {
			continue
		}
		notes = append(notes, row[0])
	}

	return notes, nil
}
