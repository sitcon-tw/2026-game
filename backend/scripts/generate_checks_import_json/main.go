package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultChecksInputPath  = "data/checks.csv"
	defaultChecksOutputPath = "data/activities.json"
	activityTypeCheck       = "check"
)

const (
	columnFileName    = "fileName"
	columnLocation    = "地點"
	columnQRCodeTitle = "QR Code 標題"
	columnURL         = "url"
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

type csvCheck struct {
	FileName    string
	Location    string
	QRCodeTitle string
	URL         string
}

func main() {
	inputPath := flag.String("in", defaultChecksInputPath, "path to source checks CSV")
	outputPath := flag.String("out", defaultChecksOutputPath, "path to destination activities JSON")
	flag.Parse()

	if err := run(*inputPath, *outputPath); err != nil {
		fmt.Fprintf(os.Stderr, "convert checks csv failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *outputPath)
}

func run(inputPath, outputPath string) error {
	src, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("read input: %w", err)
	}

	generatedChecks, err := loadChecks(src)
	if err != nil {
		return err
	}

	merged, err := mergeWithExistingActivities(outputPath, generatedChecks)
	if err != nil {
		return err
	}

	b, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		return fmt.Errorf("encode output json: %w", err)
	}
	b = append(b, '\n')

	if err = os.WriteFile(outputPath, b, 0o644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}

func loadChecks(src []byte) ([]activity, error) {
	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(src, []byte("\xef\xbb\xbf"))))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	headers, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("read csv header: %w", err)
	}

	columnIndexes := make(map[string]int, len(headers))
	for i, header := range headers {
		columnIndexes[strings.TrimSpace(header)] = i
	}

	for _, required := range []string{columnFileName, columnLocation, columnQRCodeTitle, columnURL} {
		if _, ok := columnIndexes[required]; !ok {
			return nil, fmt.Errorf("csv missing required column %q", required)
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)
	items := make([]activity, 0)
	for rowNum := 2; ; rowNum++ {
		record, readErr := reader.Read()
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return nil, fmt.Errorf("read csv row %d: %w", rowNum, readErr)
		}

		item := csvCheck{
			FileName:    csvValue(record, columnIndexes[columnFileName]),
			Location:    csvValue(record, columnIndexes[columnLocation]),
			QRCodeTitle: csvValue(record, columnIndexes[columnQRCodeTitle]),
			URL:         csvValue(record, columnIndexes[columnURL]),
		}

		if item.FileName == "" && item.Location == "" && item.QRCodeTitle == "" && item.URL == "" {
			continue
		}
		if item.URL == "" {
			return nil, fmt.Errorf("csv row %d missing url", rowNum)
		}

		name := item.FileName
		if name == "" {
			name = item.QRCodeTitle
		}

		items = append(items, activity{
			ID:          uuid.NewString(),
			Token:       uuid.NewString(),
			Type:        activityTypeCheck,
			QRCodeToken: item.URL,
			Name:        name,
			Description: stringPtr(item.Location),
			CreatedAt:   now,
			UpdatedAt:   now,
		})
	}

	return items, nil
}

func mergeWithExistingActivities(outputPath string, checks []activity) ([]activity, error) {
	existing := make([]activity, 0)
	data, err := os.ReadFile(outputPath)
	if err != nil {
		if os.IsNotExist(err) {
			return checks, nil
		}
		return nil, fmt.Errorf("read existing activities json: %w", err)
	}

	if len(bytes.TrimSpace(data)) == 0 {
		return checks, nil
	}

	if err = json.Unmarshal(data, &existing); err != nil {
		return nil, fmt.Errorf("decode existing activities json: %w", err)
	}

	existingChecksByQR := make(map[string]activity)
	merged := make([]activity, 0, len(existing)+len(checks))
	for _, item := range existing {
		if item.Type == activityTypeCheck {
			existingChecksByQR[item.QRCodeToken] = item
			continue
		}
		merged = append(merged, item)
	}

	for i := range checks {
		if existingItem, ok := existingChecksByQR[checks[i].QRCodeToken]; ok {
			checks[i].ID = existingItem.ID
			checks[i].Token = existingItem.Token
			checks[i].CreatedAt = existingItem.CreatedAt
		}
	}

	merged = append(merged, checks...)
	return merged, nil
}

func csvValue(record []string, idx int) string {
	if idx < 0 || idx >= len(record) {
		return ""
	}
	return strings.TrimSpace(record[idx])
}

func stringPtr(v string) *string {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	return &v
}
