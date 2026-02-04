package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sitcon-tw/2026-game/internal/models"
	"go.uber.org/zap"
)

// Repository defines the database operations used across the app.
// It enables mocking the data layer in tests.
type Repository interface {
	StartTransaction(ctx context.Context) (pgx.Tx, error)
	DeferRollback(ctx context.Context, tx pgx.Tx)
	CommitTransaction(ctx context.Context, tx pgx.Tx) error

	GetUserByID(ctx context.Context, tx pgx.Tx, id string) (*models.User, error)
	InsertUser(ctx context.Context, tx pgx.Tx, user *models.User) error
	GetUserByQRCode(ctx context.Context, tx pgx.Tx, qr string) (*models.User, error)
	CountFriends(ctx context.Context, tx pgx.Tx, userID string) (int, error)
	CountVisitedActivities(ctx context.Context, tx pgx.Tx, userID string) (int, error)
	AddFriend(ctx context.Context, tx pgx.Tx, userID, friendID string) (bool, error)
	IncrementUnlockLevel(ctx context.Context, tx pgx.Tx, userID string) error
	ListFriends(ctx context.Context, tx pgx.Tx, userID string) ([]models.User, error)
	UpdateCurrentLevel(ctx context.Context, tx pgx.Tx, userID string, newLevel int) error
	GetTopUsers(ctx context.Context, tx pgx.Tx, limit, offset int) ([]models.User, error)
	GetUserWithRank(ctx context.Context, tx pgx.Tx, userID string) (*models.User, int, error)
	GetAroundUsers(ctx context.Context, tx pgx.Tx, userID string, span int) ([]models.User, error)
}

// PGRepository is the production repository backed by pgx.
type PGRepository struct {
	DB     *pgxpool.Pool
	Logger *zap.Logger
}

// New creates a repository backed by pgx pool.
func New(db *pgxpool.Pool, logger *zap.Logger) Repository {
	return &PGRepository{
		DB:     db,
		Logger: logger,
	}
}
