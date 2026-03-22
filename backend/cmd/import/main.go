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
const fakeDataDir = "fake_data"

type importTarget string
type dataSource string

const (
	targetActivities    importTarget = "activities"
	targetStaffs        importTarget = "staffs"
	targetUsers         importTarget = "users"
	targetAnnouncements importTarget = "announcements"
	targetGiftCoupons   importTarget = "gift-coupons"
	targetAll           importTarget = "all"
)

const (
	sourceAuto dataSource = "auto"
	sourceFake dataSource = "fake"
	sourceData dataSource = "data"
)

func main() {
	const requiredArgs = 2
	const argsWithSource = 3
	if len(os.Args) < requiredArgs {
		fmt.Fprintln(os.Stderr, "usage: import [activities|staffs|users|announcements|gift-coupons|all] [auto|fake|data]")
		os.Exit(1)
	}

	target := importTarget(os.Args[1])
	if target != targetActivities &&
		target != targetStaffs &&
		target != targetUsers &&
		target != targetAnnouncements &&
		target != targetGiftCoupons &&
		target != targetAll {
		fmt.Fprintf(
			os.Stderr,
			"unknown target %q. valid: activities, staffs, users, announcements, gift-coupons, all\n",
			target,
		)
		os.Exit(1)
	}

	source := sourceAuto
	if len(os.Args) >= argsWithSource {
		source = dataSource(os.Args[2])
	}
	if source != sourceAuto && source != sourceFake && source != sourceData {
		fmt.Fprintf(os.Stderr, "unknown source %q. valid: auto, fake, data\n", source)
		os.Exit(1)
	}

	if _, err := config.Init(); err != nil {
		panic(err)
	}

	log := logger.New()
	defer func() {
		_ = log.Sync()
	}()

	pool, err := db.InitDatabase(log)
	if err != nil {
		log.Fatal("failed to initialize database", zap.Error(err))
	}
	defer pool.Close()

	ctx := context.Background()

	var importErr error
	switch target {
	case targetActivities:
		importErr = importActivities(ctx, pool, log, source)
	case targetStaffs:
		importErr = importStaff(ctx, pool, log, source)
	case targetUsers:
		importErr = importUsers(ctx, pool, log, source)
	case targetAnnouncements:
		importErr = importAnnouncements(ctx, pool, log, source)
	case targetGiftCoupons:
		importErr = importGiftCoupons(ctx, pool, log, source)
	case targetAll:
		importErr = importAll(ctx, pool, log, source)
	}

	if importErr != nil {
		log.Error("import failed", zap.Error(importErr), zap.String("target", string(target)), zap.String("source", string(source)))
		return
	}

	log.Info("import completed", zap.String("target", string(target)), zap.String("source", string(source)))
}

func importActivities(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	// activities.json needs token, but models.Activities omits it from JSON to avoid
	// leaking login tokens via API responses. Use a dedicated struct for import.
	type activityImport struct {
		ID          string                 `json:"id"`
		Token       string                 `json:"token"`
		Type        models.ActivitiesTypes `json:"type"`
		QRCodeToken string                 `json:"qrcode_token"`
		Name        string                 `json:"name"`
		Floor       *string                `json:"floor"`
		Link        *string                `json:"link"`
		Description *string                `json:"description"`
		CreatedAt   time.Time              `json:"created_at"`
		UpdatedAt   time.Time              `json:"updated_at"`
	}

	var items []activityImport
	if err := loadJSONCandidates(source, &items, "activities.json"); err != nil {
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
INSERT INTO activities (id, token, type, qrcode_token, name, floor, link, description, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (id) DO UPDATE
SET token = EXCLUDED.token,
    type = EXCLUDED.type,
    qrcode_token = EXCLUDED.qrcode_token,
    name = EXCLUDED.name,
    floor = EXCLUDED.floor,
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
			items[i].Floor,
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

func importStaff(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	var items []models.Staff
	if err := loadJSONCandidates(source, &items, "staff.json", "staffs.json"); err != nil {
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

func importUsers(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	// user.json contains auth_token, which is omitted from models.User JSON tags.
	// Use a dedicated struct so tokens are loaded during import.
	type userImport struct {
		ID            string    `json:"id"`
		AuthToken     string    `json:"auth_token"`
		Nickname      string    `json:"nickname"`
		Avatar        *string   `json:"avatar"`
		NamecardBio   *string   `json:"namecard_bio"`
		NamecardLinks []string  `json:"namecard_links"`
		NamecardEmail *string   `json:"namecard_email"`
		QRCodeToken   string    `json:"qrcode_token"`
		CouponToken   string    `json:"coupon_token"`
		Group         *string   `json:"group"`
		UnlockLevel   int       `json:"unlock_level"`
		CurrentLevel  int       `json:"current_level"`
		LastPassTime  time.Time `json:"last_pass_time"`
		CreatedAt     time.Time `json:"created_at"`
		UpdatedAt     time.Time `json:"updated_at"`
	}

	var items []userImport
	if err := loadJSONCandidates(source, &items, "user.json", "users.json"); err != nil {
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
INSERT INTO users (id, auth_token, nickname, avatar, namecard_bio, namecard_links, namecard_email, qrcode_token, coupon_token, "group", unlock_level, current_level, last_pass_time, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT (id) DO UPDATE
SET auth_token = EXCLUDED.auth_token,
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    namecard_bio = EXCLUDED.namecard_bio,
    namecard_links = EXCLUDED.namecard_links,
    namecard_email = EXCLUDED.namecard_email,
    qrcode_token = EXCLUDED.qrcode_token,
    coupon_token = EXCLUDED.coupon_token,
    "group" = EXCLUDED."group",
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
			items[i].NamecardBio,
			items[i].NamecardLinks,
			items[i].NamecardEmail,
			items[i].QRCodeToken,
			items[i].CouponToken,
			items[i].Group,
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

func importAnnouncements(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	var items []models.Announcement
	if err := loadJSONCandidates(source, &items, "announcement.json", "announcements.json"); err != nil {
		return fmt.Errorf("load announcements: %w", err)
	}

	if len(items) == 0 {
		log.Warn("announcement.json is empty; nothing to import")
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
INSERT INTO announcements (id, content, created_at)
VALUES ($1, $2, $3)
ON CONFLICT (id) DO UPDATE
SET content = EXCLUDED.content,
    created_at = EXCLUDED.created_at`

	now := time.Now().UTC()
	for i := range items {
		if items[i].CreatedAt.IsZero() {
			items[i].CreatedAt = now
		}
		if _, err = tx.Exec(ctx, stmt, items[i].ID, items[i].Content, items[i].CreatedAt); err != nil {
			return fmt.Errorf("insert announcements[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func importGiftCoupons(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	var items []models.DiscountCouponGift
	if err := loadJSONCandidates(
		source,
		&items,
		"gift_coupon.json",
		"gift_coupons.json",
		"discount_coupon_gift.json",
		"discount_coupon_gifts.json",
	); err != nil {
		return fmt.Errorf("load gift coupons: %w", err)
	}

	if len(items) == 0 {
		log.Warn("gift coupon json is empty; nothing to import")
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
INSERT INTO discount_coupon_gift (id, token, price, discount_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE
SET token = EXCLUDED.token,
    price = EXCLUDED.price,
    discount_id = EXCLUDED.discount_id`

	for i := range items {
		if _, err = tx.Exec(ctx, stmt, items[i].ID, items[i].Token, items[i].Price, items[i].DiscountID); err != nil {
			return fmt.Errorf("insert gift_coupons[%d] (%s): %w", i, items[i].ID, err)
		}
	}

	return tx.Commit(ctx)
}

func importAll(ctx context.Context, pool *pgxpool.Pool, log *zap.Logger, source dataSource) error {
	importers := []struct {
		name string
		fn   func(context.Context, *pgxpool.Pool, *zap.Logger, dataSource) error
	}{
		{name: string(targetActivities), fn: importActivities},
		{name: string(targetStaffs), fn: importStaff},
		{name: string(targetUsers), fn: importUsers},
		{name: string(targetAnnouncements), fn: importAnnouncements},
		{name: string(targetGiftCoupons), fn: importGiftCoupons},
	}

	for _, importer := range importers {
		if err := importer.fn(ctx, pool, log, source); err != nil {
			return fmt.Errorf("%s: %w", importer.name, err)
		}
	}

	return nil
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

func loadJSONCandidates[T any](source dataSource, out *T, fileNames ...string) error {
	dirs := []string{fakeDataDir, dataDir}
	switch source {
	case sourceAuto:
		dirs = []string{fakeDataDir, dataDir}
	case sourceFake:
		dirs = []string{fakeDataDir}
	case sourceData:
		dirs = []string{dataDir}
	}

	for _, dir := range dirs {
		for _, name := range fileNames {
			fullPath := filepath.Join(dir, name)
			_, err := os.Stat(fullPath)
			if err != nil {
				if errors.Is(err, os.ErrNotExist) {
					continue
				}
				return err
			}
			return loadJSON(fullPath, out)
		}
	}

	return fmt.Errorf("none of candidate files found: %v", fileNames)
}
