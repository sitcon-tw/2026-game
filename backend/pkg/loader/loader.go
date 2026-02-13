package loader

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"strconv"

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

		lvl, convErr := strconv.Atoi(row[0])
		if convErr != nil {
			return nil, fmt.Errorf("parse level %q: %w", row[0], convErr)
		}
		speed, convErr := strconv.Atoi(row[1])
		if convErr != nil {
			return nil, fmt.Errorf("parse speed %q: %w", row[1], convErr)
		}
		notes, convErr := strconv.Atoi(row[2])
		if convErr != nil {
			return nil, fmt.Errorf("parse notes %q: %w", row[2], convErr)
		}

		levels = append(levels, models.Level{Level: lvl, Speed: speed, Notes: notes})
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
