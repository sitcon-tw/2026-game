package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sitcon-tw/2026-game/internal/models"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/db"
	"github.com/sitcon-tw/2026-game/pkg/logger"
	"go.uber.org/zap"
)

const dataDir = "data"

type importTarget string

const (
	targetActivities importTarget = "activities"
	targetStaffs     importTarget = "staffs"
	targetUsers      importTarget = "users"
)

func main() {
	const requiredArgs = 2
	if len(os.Args) < requiredArgs {
		fmt.Fprintln(os.Stderr, "usage: import [activities|staffs|users]")
		os.Exit(1)
	}

	target := importTarget(os.Args[1])
	if target != targetActivities && target != targetStaffs && target != targetUsers {
		fmt.Fprintf(os.Stderr, "unknown target %q. valid: activities, staffs, users\n", target)
		os.Exit(1)
	}

	if _, err := config.Init(); err != nil {
		panic(err)
	}

	log := logger.New()

	pool, err := db.InitDatabase(log)
	if err != nil {
		log.Fatal("failed to initialize database", zap.Error(err))
	}
	defer pool.Close()

	ctx := context.Background()

	var importErr error
	switch target {
	case targetActivities:
		importErr = importActivities(ctx, pool, log)
	case targetStaffs:
		importErr = importStaff(ctx, pool, log)
	case targetUsers:
		importErr = importUsers(ctx, pool, log)
	}

	if importErr != nil {
		log.Error("import failed", zap.Error(importErr), zap.String("target", string(target)))
		return
	}

	log.Info("import completed", zap.String("target", string(target)))
}

func importActivities(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	// activities.json needs token, but models.Activities omits it from JSON to avoid
	// leaking login tokens via API responses. Use a dedicated struct for import.
	type activityImport struct {
		ID          string                 `json:"id"`
		Token       string                 `json:"token"`
		Type        models.ActivitiesTypes `json:"type"`
		QRCodeToken string                 `json:"qrcode_token"`
		Name        string                 `json:"name"`
		Link        *string                `json:"link"`
		Description *string                `json:"description"`
		CreatedAt   time.Time              `json:"created_at"`
		UpdatedAt   time.Time              `json:"updated_at"`
	}

	var items []activityImport
	if err := loadJSON(filepath.Join(dataDir, "activities.json"), &items); err != nil {
		return fmt.Errorf("load activities: %w", err)
	}

	if len(items) == 0 {
		log.Warn("activities.json is empty; nothing to import")
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && !errors.Is(rollbackErr, pgx.ErrTxClosed) {
			log.Warn("rollback failed", zap.Error(rollbackErr))
		}
	}()

	const stmt = `
INSERT INTO activities (id, token, type, qrcode_token, name, link, description, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (id) DO UPDATE
SET token = EXCLUDED.token,
    type = EXCLUDED.type,
    qrcode_token = EXCLUDED.qrcode_token,
    name = EXCLUDED.name,
    link = EXCLUDED.link,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at`

	now := time.Now().UTC()
	for i := range items {
		if items[i].CreatedAt.IsZero() {
			items[i].CreatedAt = now
		}
		if items[i].UpdatedAt.IsZero() {
			items[i].UpdatedAt = items[i].CreatedAt
		}

		if _, err = tx.Exec(ctx, stmt,
			items[i].ID,
			items[i].Token,
			items[i].Type,
			items[i].QRCodeToken,
			items[i].Name,
			items[i].Link,
			items[i].Description,
			items[i].CreatedAt,
			items[i].UpdatedAt,
		); err != nil {
			return fmt.Errorf("insert activities[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func importStaff(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	var items []models.Staff
	if err := loadJSON(filepath.Join(dataDir, "staffs.json"), &items); err != nil {
		return fmt.Errorf("load staffs: %w", err)
	}

	if len(items) == 0 {
		log.Warn("staff.json is empty; nothing to import")
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && !errors.Is(rollbackErr, pgx.ErrTxClosed) {
			log.Warn("rollback failed", zap.Error(rollbackErr))
		}
	}()

	const stmt = `
INSERT INTO staffs (id, name, token, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    token = EXCLUDED.token,
    updated_at = EXCLUDED.updated_at`

	now := time.Now().UTC()
	for i := range items {
		if items[i].CreatedAt.IsZero() {
			items[i].CreatedAt = now
		}
		if items[i].UpdatedAt.IsZero() {
			items[i].UpdatedAt = items[i].CreatedAt
		}

		if _, err = tx.Exec(ctx, stmt,
			items[i].ID,
			items[i].Name,
			items[i].Token,
			items[i].CreatedAt,
			items[i].UpdatedAt,
		); err != nil {
			return fmt.Errorf("insert staffs[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func importUsers(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	// user.json contains auth_token, which is omitted from models.User JSON tags.
	// Use a dedicated struct so tokens are loaded during import.
	type userImport struct {
		ID           string    `json:"id"`
		AuthToken    string    `json:"auth_token"`
		Nickname     string    `json:"nickname"`
		Avatar       *string   `json:"avatar"`
		QRCodeToken  string    `json:"qrcode_token"`
		CouponToken  string    `json:"coupon_token"`
		UnlockLevel  int       `json:"unlock_level"`
		CurrentLevel int       `json:"current_level"`
		LastPassTime time.Time `json:"last_pass_time"`
		CreatedAt    time.Time `json:"created_at"`
		UpdatedAt    time.Time `json:"updated_at"`
	}

	var items []userImport
	if err := loadJSON(filepath.Join(dataDir, "users.json"), &items); err != nil {
		return fmt.Errorf("load users: %w", err)
	}

	if len(items) == 0 {
		log.Warn("user.json is empty; nothing to import")
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && !errors.Is(rollbackErr, pgx.ErrTxClosed) {
			log.Warn("rollback failed", zap.Error(rollbackErr))
		}
	}()

	const stmt = `
INSERT INTO users (id, auth_token, nickname, avatar, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
ON CONFLICT (id) DO UPDATE
SET auth_token = EXCLUDED.auth_token,
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    qrcode_token = EXCLUDED.qrcode_token,
    coupon_token = EXCLUDED.coupon_token,
    unlock_level = EXCLUDED.unlock_level,
    current_level = EXCLUDED.current_level,
    last_pass_time = EXCLUDED.last_pass_time,
    updated_at = EXCLUDED.updated_at`

	now := time.Now().UTC()
	for i := range items {
		if items[i].LastPassTime.IsZero() {
			items[i].LastPassTime = now
		}
		if items[i].CreatedAt.IsZero() {
			items[i].CreatedAt = now
		}
		if items[i].UpdatedAt.IsZero() {
			items[i].UpdatedAt = items[i].CreatedAt
		}

		if _, err = tx.Exec(ctx, stmt,
			items[i].ID,
			items[i].AuthToken,
			items[i].Nickname,
			items[i].Avatar,
			items[i].QRCodeToken,
			items[i].CouponToken,
			items[i].UnlockLevel,
			items[i].CurrentLevel,
			items[i].LastPassTime,
			items[i].CreatedAt,
			items[i].UpdatedAt,
		); err != nil {
			return fmt.Errorf("insert user[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func loadJSON[T any](path string, out *T) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if len(data) == 0 {
		return errors.New("file is empty")
	}
	if err = json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("parse %s: %w", filepath.Base(path), err)
	}
	return nil
}
