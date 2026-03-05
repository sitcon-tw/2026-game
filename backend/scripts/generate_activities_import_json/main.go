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
	defaultActivitiesInputPath  = "data/activities.json"
	defaultActivitiesOutputPath = "data/activities.import.json"
	boothType                   = "booth"
)

type inputActivity struct {
	ID          any    `json:"id"`
	Token       any    `json:"token"`
	Type        string `json:"type"`
	QRCodeToken any    `json:"qrcode_token"`
	Name        string `json:"name"`
	Floor       any    `json:"floor"`
	Link        any    `json:"link"`
	Description any    `json:"description"`
	CreatedAt   any    `json:"created_at"`
	UpdatedAt   any    `json:"updated_at"`
}

type outputActivity struct {
	ID          string      `json:"id"`
	Token       string      `json:"token"`
	Type        string      `json:"type"`
	QRCodeToken string      `json:"qrcode_token"`
	Name        string      `json:"name"`
	Floor       interface{} `json:"floor"`
	Link        interface{} `json:"link"`
	Description interface{} `json:"description"`
	CreatedAt   string      `json:"created_at"`
	UpdatedAt   string      `json:"updated_at"`
}

func main() {
	inputPath := flag.String("in", defaultActivitiesInputPath, "path to source activities JSON")
	outputPath := flag.String("out", defaultActivitiesOutputPath, "path to destination JSON")
	writeInPlace := flag.Bool("in-place", false, "overwrite input file")
	flag.Parse()

	dst := *outputPath
	if *writeInPlace {
		dst = *inputPath
	}

	if err := run(*inputPath, dst); err != nil {
		fmt.Fprintf(os.Stderr, "convert activities json failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", dst)
}

func run(inputPath, outputPath string) error {
	src, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("read input: %w", err)
	}

	var items []inputActivity
	if err = json.Unmarshal(src, &items); err != nil {
		return fmt.Errorf("decode input json: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	outItems := make([]outputActivity, 0, len(items))
	for _, item := range items {
		createdAt := coerceString(item.CreatedAt)
		if createdAt == "" {
			createdAt = now
		}

		updatedAt := coerceString(item.UpdatedAt)
		if updatedAt == "" {
			updatedAt = createdAt
		}

		outItems = append(outItems, outputActivity{
			ID:          coerceOrNewUUID(item.ID),
			Token:       coerceOrNewUUID(item.Token),
			Type:        boothType,
			QRCodeToken: coerceOrNewUUID(item.QRCodeToken),
			Name:        item.Name,
			Floor:       item.Floor,
			Link:        item.Link,
			Description: item.Description,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
		})
	}

	b, err := json.MarshalIndent(outItems, "", "  ")
	if err != nil {
		return fmt.Errorf("encode output json: %w", err)
	}
	b = append(b, '\n')

	if err = os.WriteFile(outputPath, b, 0o644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}

func coerceOrNewUUID(v any) string {
	s := coerceString(v)
	if s != "" {
		return s
	}
	return uuid.NewString()
}

func coerceString(v any) string {
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}
