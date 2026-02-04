package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/db"
	"github.com/sitcon-tw/2026-game/pkg/logger"
	"go.uber.org/zap"
)

// Activity mirrors the activities table schema for seeding via JSON.
type Activity struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	QRCodeToken string `json:"qrcode_token"`
	Name        string `json:"name"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// Attender mirrors the users table schema for seeding via JSON.
type Attender struct {
	ID           string `json:"id"`
	Nickname     string `json:"nickname"`
	QRCodeToken  string `json:"qrcode_token"`
	UnlockLevel  int    `json:"unlock_level"`
	CurrentLevel int    `json:"current_level"`
	LastPassTime string `json:"last_pass_time"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

func loadJSON[T any](path string, target *T) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s: %w", path, err)
	}
	if err := json.Unmarshal(raw, target); err != nil {
		return fmt.Errorf("parse %s: %w", path, err)
	}
	return nil
}

func insertActivities(ctx context.Context, tx pgx.Tx, activities []Activity) error {
	const stmt = `INSERT INTO activities (id, type, qrcode_token, name, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO NOTHING`

	for _, a := range activities {
		if _, err := tx.Exec(ctx, stmt, a.ID, a.Type, a.QRCodeToken, a.Name, a.CreatedAt, a.UpdatedAt); err != nil {
			return fmt.Errorf("insert activity %s: %w", a.ID, err)
		}
	}
	return nil
}

func insertAttenders(ctx context.Context, tx pgx.Tx, attenders []Attender) error {
	const stmt = `INSERT INTO users (id, nickname, qrcode_token, unlock_level, current_level, last_pass_time, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO NOTHING`

	for _, u := range attenders {
		if _, err := tx.Exec(ctx, stmt, u.ID, u.Nickname, u.QRCodeToken, u.UnlockLevel, u.CurrentLevel, u.LastPassTime, u.CreatedAt, u.UpdatedAt); err != nil {
			return fmt.Errorf("insert user %s: %w", u.ID, err)
		}
	}
	return nil
}

func main() {
	if _, err := config.Init(); err != nil {
		panic(fmt.Errorf("load config: %w", err))
	}

	log := logger.New()

	pool, err := db.InitDatabase(log)
	if err != nil {
		log.Fatal("db init failed", zap.Error(err))
	}
	defer pool.Close()

	ctx := context.Background()
	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatal("start tx failed", zap.Error(err))
	}
	defer tx.Rollback(ctx)

	var activities []Activity
	if err := loadJSON("data/activites.json", &activities); err != nil {
		log.Fatal("load activites.json failed", zap.Error(err))
	}

	var attenders []Attender
	if err := loadJSON("data/attender.json", &attenders); err != nil {
		log.Fatal("load attender.json failed", zap.Error(err))
	}

	if err := insertActivities(ctx, tx, activities); err != nil {
		log.Fatal("insert activities failed", zap.Error(err))
	}
	if err := insertAttenders(ctx, tx, attenders); err != nil {
		log.Fatal("insert attenders failed", zap.Error(err))
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatal("commit failed", zap.Error(err))
	}

	log.Info("Seeding completed", zap.Int("activities", len(activities)), zap.Int("attenders", len(attenders)))
}
