package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
)

const defaultOutputPath = "data/staffs.json"

var staffNames = []string{
	"xx",
}

type staff struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Token     string `json:"token"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func main() {
	outputPath := flag.String("out", defaultOutputPath, "path to destination staff JSON")
	flag.Parse()

	if err := run(*outputPath); err != nil {
		fmt.Fprintf(os.Stderr, "generate staff json failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *outputPath)
}

func run(outputPath string) error {
	baseTime := time.Date(2026, time.January, 10, 8, 30, 0, 0, time.UTC)
	staffs := make([]staff, 0, len(staffNames))

	for i, name := range staffNames {
		timestamp := baseTime.Add(time.Duration(i) * 5 * time.Minute).Format(time.RFC3339)
		staffs = append(staffs, staff{
			ID:        uuid.NewString(),
			Name:      name,
			Token:     uuid.NewString(),
			CreatedAt: timestamp,
			UpdatedAt: timestamp,
		})
	}

	b, err := json.MarshalIndent(staffs, "", "  ")
	if err != nil {
		return fmt.Errorf("encode output json: %w", err)
	}
	b = append(b, '\n')

	if err = os.WriteFile(outputPath, b, 0o644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}
