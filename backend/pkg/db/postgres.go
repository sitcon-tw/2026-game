package db

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"

	"github.com/exaring/otelpgx"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres" // Register postgres migrations driver.
	_ "github.com/golang-migrate/migrate/v4/source/file"       // Register file source for migrations.
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap"
)

// InitDatabase initialize the database connection pool and runs migrations when enabled.
func InitDatabase(logger *zap.Logger) (*pgxpool.Pool, error) {
	ctx := context.Background()

	poolConfig, err := pgxpool.ParseConfig(getDatabaseURL())
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5

	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	poolConfig.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}
	err = pool.Ping(ctx)
	if err != nil {
		pool.Close()
		return nil, err
	}

	logger.Info("Database initialized")

	migrator(logger)

	return pool, nil
}

// getDatabaseURL return a pgsql connection uri by the environment variables.
func getDatabaseURL() string {
	dbHost := config.Env().DBHost
	dbPort := config.Env().DBPort
	dbUser := config.Env().DBUser
	dbPassword := config.Env().DBPassword
	dbName := config.Env().DBName
	dbSSLMode := config.Env().DBSSLMode
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	hostPort := net.JoinHostPort(dbHost, dbPort)

	return fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=%s",
		dbUser, dbPassword, hostPort, dbName, dbSSLMode,
	)
}

// migrator runs database migrations when enabled.
func migrator(logger *zap.Logger) {
	if !config.Env().AppAutoMigrate {
		logger.Info("Skipping database migration (APP_AUTO_MIGRATE is false)")
		return
	}

	logger.Info("Migrating database")

	wd, _ := os.Getwd()

	databaseURL := getDatabaseURL()
	migrationsPath := "file://" + wd + "/migrations"

	m, err := migrate.New(migrationsPath, databaseURL)
	if err != nil {
		logger.Fatal("failed to create migrator", zap.Error(err))
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		logger.Fatal("failed to migrate database", zap.Error(err))
	}

	logger.Info("Database migrated")
}
