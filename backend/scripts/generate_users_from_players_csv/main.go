package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultInputPath   = "data/playerscsv.csv"
	defaultOutputPath  = "data/users.json"
	defaultUnlockLvl   = 5
	userNamespaceID    = "8b27158b-e55d-4141-a9d0-0d1a8f38c101"
	qrCodeNamespaceID  = "e643fd8b-42f7-42c2-9eb3-f6ab94c7031f"
	couponNamespaceID  = "5db5aaf7-fe3e-4fbb-9682-1276ce3eaefb"
	avatarNamespaceID  = "7e2d90cc-84f2-4e89-b33e-3863ac7bf0a3"
	fallbackAvatarBase = "https://api.dicebear.com/9.x/thumbs/svg?seed="
)

type userRecord struct {
	ID            string   `json:"id"`
	AuthToken     string   `json:"auth_token"`
	Nickname      string   `json:"nickname"`
	Avatar        *string  `json:"avatar,omitempty"`
	NamecardBio   *string  `json:"namecard_bio,omitempty"`
	NamecardLinks []string `json:"namecard_links,omitempty"`
	NamecardEmail *string  `json:"namecard_email,omitempty"`
	QRCodeToken   string   `json:"qrcode_token"`
	CouponToken   string   `json:"coupon_token"`
	Group         *string  `json:"group,omitempty"`
	UnlockLevel   int      `json:"unlock_level"`
	CurrentLevel  int      `json:"current_level"`
	LastPassTime  string   `json:"last_pass_time"`
	CreatedAt     string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
}

func main() {
	inputPath := flag.String("in", defaultInputPath, "path to source CSV")
	outputPath := flag.String("out", defaultOutputPath, "path to destination JSON")
	flag.Parse()

	if err := run(*inputPath, *outputPath); err != nil {
		fmt.Fprintf(os.Stderr, "convert players csv to users json failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *outputPath)
}

func run(inputPath, outputPath string) error {
	baseTime := time.Date(2026, time.January, 10, 8, 30, 0, 0, time.UTC)
	userNamespace := uuid.MustParse(userNamespaceID)
	qrCodeNamespace := uuid.MustParse(qrCodeNamespaceID)
	couponNamespace := uuid.MustParse(couponNamespaceID)
	avatarNamespace := uuid.MustParse(avatarNamespaceID)

	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("open csv: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.FieldsPerRecord = -1
	rows, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("read csv: %w", err)
	}
	if len(rows) == 0 {
		return errors.New("csv is empty")
	}

	indexes, err := findIndexes(rows[0])
	if err != nil {
		return err
	}

	users := make([]userRecord, 0, len(rows)-1)
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		token := strings.TrimSpace(getCell(row, indexes.token))
		if token == "" {
			continue
		}

		nickname := strings.TrimSpace(getCell(row, indexes.name))
		if nickname == "" {
			nickname = token
		}

		var group *string
		groupName := strings.TrimSpace(getCell(row, indexes.group))
		if groupName != "" {
			group = &groupName
		}

		avatarURL := strings.TrimSpace(getCell(row, indexes.avatar))
		if avatarURL == "" {
			avatarURL = fallbackAvatarBase + uuid.NewSHA1(avatarNamespace, []byte(token)).String()
		}

		timestamp := baseTime.Add(time.Duration(len(users)) * time.Minute).Format(time.RFC3339)
		users = append(users, userRecord{
			ID:            uuid.NewSHA1(userNamespace, []byte(token)).String(),
			AuthToken:     token,
			Nickname:      nickname,
			Avatar:        &avatarURL,
			NamecardLinks: []string{},
			QRCodeToken:   uuid.NewSHA1(qrCodeNamespace, []byte(token)).String(),
			CouponToken:   uuid.NewSHA1(couponNamespace, []byte(token)).String(),
			Group:         group,
			UnlockLevel:   defaultUnlockLvl,
			CurrentLevel:  0,
			LastPassTime:  timestamp,
			CreatedAt:     timestamp,
			UpdatedAt:     timestamp,
		})
	}

	if len(users) == 0 {
		return errors.New("no valid rows found (TOKEN is empty on all rows)")
	}

	b, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		return fmt.Errorf("encode json: %w", err)
	}
	b = append(b, '\n')

	if err = os.WriteFile(outputPath, b, 0o644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}

type columnIndexes struct {
	token  int
	name   int
	group  int
	avatar int
}

func findIndexes(header []string) (columnIndexes, error) {
	indexes := columnIndexes{
		token:  findColumn(header, "TOKEN", "token", "Code", "code"),
		name:   findColumn(header, "NAME", "name", "暱稱"),
		group:  findColumn(header, "group", "Group", "組別"),
		avatar: findColumn(header, "Gravatar", "gravatar", "Avatar", "avatar"),
	}

	if indexes.token == -1 || indexes.name == -1 {
		return indexes, fmt.Errorf("required columns missing; token=%d name=%d", indexes.token, indexes.name)
	}

	return indexes, nil
}

func findColumn(header []string, names ...string) int {
	for i := range header {
		cell := strings.TrimSpace(header[i])
		if slices.Contains(names, cell) {
			return i
		}
	}
	return -1
}

func getCell(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return row[idx]
}
