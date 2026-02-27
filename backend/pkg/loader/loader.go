package loader

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sitcon-tw/2026-game/internal/models"
)

const (
	levelColumns   = 4
	requestTimeout = 10 * time.Second
)

// LoadLevels reads level configuration from a CSV URL.
func LoadLevels(csvURL string) ([]models.Level, error) {
	f, err := fetchCSV(csvURL)
	if err != nil {
		return nil, fmt.Errorf("fetch level csv: %w", err)
	}
	defer f.Close()

	r := csv.NewReader(f)

	header, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("read header: %w", err)
	}
	if err = validateLevelHeader(header); err != nil {
		return nil, err
	}

	return readLevels(r)
}

func readLevels(r *csv.Reader) ([]models.Level, error) {
	levels := []models.Level{}

	for {
		row, err := r.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read row: %w", err)
		}

		level, err := parseLevelRow(row)
		if err != nil {
			return nil, err
		}
		levels = append(levels, level)
	}

	return levels, nil
}

func parseLevelRow(row []string) (models.Level, error) {
	if len(row) != levelColumns {
		return models.Level{}, fmt.Errorf("row has %d columns, want exactly %d", len(row), levelColumns)
	}

	return parseRangeLevelRow(row)
}

func parseRangeLevelRow(row []string) (models.Level, error) {
	levelStart, err := parsePositiveInt(row[0], "level start")
	if err != nil {
		return models.Level{}, err
	}
	levelEnd, err := parsePositiveInt(row[1], "level end")
	if err != nil {
		return models.Level{}, err
	}
	speed, err := parsePositiveInt(row[2], "speed")
	if err != nil {
		return models.Level{}, err
	}
	notes, err := parsePositiveInt(row[3], "notes")
	if err != nil {
		return models.Level{}, err
	}
	if levelEnd < levelStart {
		return models.Level{}, fmt.Errorf("invalid level range: start=%d end=%d", levelStart, levelEnd)
	}

	return models.Level{
		StartLevel: levelStart,
		EndLevel:   levelEnd,
		Speed:      speed,
		Notes:      notes,
	}, nil
}

func parsePositiveInt(raw, field string) (int, error) {
	value, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		return 0, fmt.Errorf("parse %s %q: %w", field, raw, err)
	}
	if value <= 0 {
		return 0, fmt.Errorf("invalid %s: %d", field, value)
	}
	return value, nil
}

func validateLevelHeader(header []string) error {
	if len(header) != levelColumns {
		return fmt.Errorf("level csv has %d columns, want exactly %d", len(header), levelColumns)
	}

	expected := []string{"level start", "level end", "speed", "notes"}
	for i := range expected {
		actual := strings.ToLower(strings.TrimSpace(strings.TrimPrefix(header[i], "\ufeff")))
		if actual != expected[i] {
			return fmt.Errorf("invalid level csv header at column %d: got %q, want %q", i+1, header[i], expected[i])
		}
	}
	return nil
}

// LoadSheetMusic reads a list of note names from a one-column CSV URL.
func LoadSheetMusic(csvURL string) ([]string, error) {
	f, err := fetchCSV(csvURL)
	if err != nil {
		return nil, fmt.Errorf("fetch sheet music csv: %w", err)
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

func fetchCSV(csvURL string) (io.ReadCloser, error) {
	if strings.TrimSpace(csvURL) == "" {
		return nil, errors.New("csv url is empty")
	}

	client := &http.Client{
		Timeout: requestTimeout,
	}

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, csvURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build request for csv url %q: %w", csvURL, err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http get csv url %q: %w", csvURL, err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		defer resp.Body.Close()
		return nil, fmt.Errorf("csv url returned status %d", resp.StatusCode)
	}

	return resp.Body, nil
}
