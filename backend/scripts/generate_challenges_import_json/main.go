package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
)

const (
	defaultOutputPath     = "data/activities.json"
	activityTypeChallenge = "challenge"
)

type activity struct {
	ID          string  `json:"id"`
	Token       string  `json:"token"`
	Type        string  `json:"type"`
	QRCodeToken string  `json:"qrcode_token"`
	Name        string  `json:"name"`
	Floor       *string `json:"floor,omitempty"`
	Link        *string `json:"link,omitempty"`
	Description *string `json:"description,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func main() {
	outputPath := flag.String("out", defaultOutputPath, "path to destination activities JSON")
	flag.Parse()

	if err := run(*outputPath); err != nil {
		fmt.Fprintf(os.Stderr, "generate challenges json failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *outputPath)
}

func run(outputPath string) error {
	existing, err := loadExistingActivities(outputPath)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	wanted := []activity{
		newChallenge("與講者有約", now),
		newChallenge("導遊團", now),
	}

	existingByName := make(map[string]activity)
	merged := make([]activity, 0, len(existing)+len(wanted))
	for _, item := range existing {
		if item.Type == activityTypeChallenge {
			existingByName[item.Name] = item
			continue
		}
		merged = append(merged, item)
	}

	for i := range wanted {
		if old, ok := existingByName[wanted[i].Name]; ok {
			wanted[i].ID = old.ID
			wanted[i].Token = old.Token
			wanted[i].QRCodeToken = old.QRCodeToken
			wanted[i].CreatedAt = old.CreatedAt
		}
		merged = append(merged, wanted[i])
	}

	b, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		return fmt.Errorf("encode output json: %w", err)
	}
	if err := os.WriteFile(outputPath, append(b, '\n'), 0o644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}

func loadExistingActivities(path string) ([]activity, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read existing activities: %w", err)
	}

	if len(data) == 0 {
		return nil, nil
	}

	var items []activity
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, fmt.Errorf("decode existing activities: %w", err)
	}

	return items, nil
}

func newChallenge(name, now string) activity {
	return activity{
		ID:          uuid.NewString(),
		Token:       uuid.NewString(),
		Type:        activityTypeChallenge,
		QRCodeToken: uuid.NewString(),
		Name:        name,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
