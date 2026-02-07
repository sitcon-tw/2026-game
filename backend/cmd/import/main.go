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
	targetStaff      importTarget = "staff"
	targetUser       importTarget = "user"
)

func main() {
	const requiredArgs = 2
	if len(os.Args) < requiredArgs {
		fmt.Fprintln(os.Stderr, "usage: import [activities|staff|user]")
		os.Exit(1)
	}

	target := importTarget(os.Args[1])
	if target != targetActivities && target != targetStaff && target != targetUser {
		fmt.Fprintf(os.Stderr, "unknown target %q. valid: activities, staff, user\n", target)
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
	case targetStaff:
		importErr = importStaff(ctx, pool, log)
	case targetUser:
		importErr = importUsers(ctx, pool, log)
	}

	if importErr != nil {
		log.Error("import failed", zap.Error(importErr), zap.String("target", string(target)))
		return
	}

	log.Info("import completed", zap.String("target", string(target)))
}

func importActivities(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	var items []models.Activities
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
INSERT INTO activities (id, token, type, qrcode_token, name, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (id) DO UPDATE
SET token = EXCLUDED.token,
    type = EXCLUDED.type,
    qrcode_token = EXCLUDED.qrcode_token,
    name = EXCLUDED.name,
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
	if err := loadJSON(filepath.Join(dataDir, "staff.json"), &items); err != nil {
		return fmt.Errorf("load staff: %w", err)
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
INSERT INTO staff (id, name, token, created_at, updated_at)
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
			return fmt.Errorf("insert staff[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func importUsers(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger) error {
	var items []models.User
	if err := loadJSON(filepath.Join(dataDir, "user.json"), &items); err != nil {
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
INSERT INTO users (id, auth_token, nickname, qrcode_token, coupon_token, unlock_level, current_level, last_pass_time, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (id) DO UPDATE
SET auth_token = EXCLUDED.auth_token,
    nickname = EXCLUDED.nickname,
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
