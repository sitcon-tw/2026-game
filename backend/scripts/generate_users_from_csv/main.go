package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultInputPath  = "data/SITCON_2026_users.csv"
	defaultOutputPath = "data/user.json"
	defaultUnlockLvl  = 5
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
		fmt.Fprintf(os.Stderr, "convert csv to users json failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *outputPath)
}

func run(inputPath, outputPath string) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("open csv: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	rows, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("read csv: %w", err)
	}
	if len(rows) == 0 {
		return errors.New("csv is empty")
	}

	header := rows[0]
	groupIdx := findColumn(header, "組別")
	if groupIdx == -1 {
		groupIdx = findColumn(header, "æ")
	}
	codeIdx := findColumn(header, "Code")
	nicknameIdx := findColumn(header, "暱稱")
	if codeIdx == -1 || nicknameIdx == -1 {
		return fmt.Errorf("required columns missing; code=%d nickname=%d", codeIdx, nicknameIdx)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	users := make([]userRecord, 0, len(rows)-1)

	for i := 1; i < len(rows); i++ {
		row := rows[i]
		code := strings.TrimSpace(getCell(row, codeIdx))
		if code == "" {
			continue
		}

		nickname := strings.TrimSpace(getCell(row, nicknameIdx))
		if nickname == "" {
			nickname = code
		}

		var group *string
		groupName := strings.TrimSpace(getCell(row, groupIdx))
		if groupName != "" {
			group = &groupName
		}

		userID := uuid.NewString()
		avatar := fmt.Sprintf("https://api.dicebear.com/9.x/thumbs/svg?seed=%s", userID)

		users = append(users, userRecord{
			ID:            userID,
			AuthToken:     code,
			Nickname:      nickname,
			Avatar:        &avatar,
			NamecardLinks: []string{},
			QRCodeToken:   uuid.NewString(),
			CouponToken:   uuid.NewString(),
			Group:         group,
			UnlockLevel:   defaultUnlockLvl,
			CurrentLevel:  0,
			LastPassTime:  now,
			CreatedAt:     now,
			UpdatedAt:     now,
		})
	}

	if len(users) == 0 {
		return errors.New("no valid rows found (Code is empty on all rows)")
	}

	out, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create json: %w", err)
	}
	defer out.Close()

	encoder := json.NewEncoder(out)
	encoder.SetIndent("", "  ")
	if err = encoder.Encode(users); err != nil {
		return fmt.Errorf("encode json: %w", err)
	}

	return nil
}

func findColumn(header []string, name string) int {
	for i := range header {
		if strings.TrimSpace(header[i]) == name {
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
