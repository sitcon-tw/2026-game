package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultActivitiesInputPath  = "data/activities.json"
	defaultActivitiesOutputPath = "data/activities.import.json"
	boothType                   = "booth"
)

const (
	columnName        = "攤位名稱"
	columnDescription = "攤位描述"
	columnLink        = "連結"
	columnFloor       = "位置"
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
	ID          string `json:"id"`
	Token       string `json:"token"`
	Type        string `json:"type"`
	QRCodeToken string `json:"qrcode_token"`
	Name        string `json:"name"`
	Floor       any    `json:"floor"`
	Link        any    `json:"link"`
	Description any    `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type csvActivity struct {
	Name        string
	Description string
	Link        string
	Floor       string
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

	items, err := loadActivities(inputPath, src)
	if err != nil {
		return err
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

func loadActivities(inputPath string, src []byte) ([]inputActivity, error) {
	switch strings.ToLower(filepath.Ext(inputPath)) {
	case ".csv":
		return loadCSVActivities(src)
	default:
		var items []inputActivity
		if err := json.Unmarshal(src, &items); err != nil {
			return nil, fmt.Errorf("decode input json: %w", err)
		}
		return items, nil
	}
}

func loadCSVActivities(src []byte) ([]inputActivity, error) {
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

	for _, required := range []string{columnName, columnDescription, columnLink, columnFloor} {
		if _, ok := columnIndexes[required]; !ok {
			return nil, fmt.Errorf("csv missing required column %q", required)
		}
	}

	rows := make([]inputActivity, 0)
	for rowNum := 2; ; rowNum++ {
		record, err := reader.Read()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, fmt.Errorf("read csv row %d: %w", rowNum, err)
		}

		item := csvActivity{
			Name:        csvValue(record, columnIndexes[columnName]),
			Description: csvValue(record, columnIndexes[columnDescription]),
			Link:        csvValue(record, columnIndexes[columnLink]),
			Floor:       csvValue(record, columnIndexes[columnFloor]),
		}

		if item.Name == "" && item.Description == "" && item.Link == "" && item.Floor == "" {
			continue
		}

		rows = append(rows, inputActivity{
			ID:          uuid.NewString(),
			Type:        boothType,
			Name:        item.Name,
			Floor:       stringOrNil(item.Floor),
			Link:        stringOrNil(item.Link),
			Description: stringOrNil(item.Description),
		})
	}

	return rows, nil
}

func csvValue(record []string, idx int) string {
	if idx < 0 || idx >= len(record) {
		return ""
	}
	return strings.TrimSpace(record[idx])
}

func stringOrNil(v string) any {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	return v
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
