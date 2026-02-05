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
	// Transaction management
	StartTransaction(ctx context.Context) (pgx.Tx, error)
	DeferRollback(ctx context.Context, tx pgx.Tx)
	CommitTransaction(ctx context.Context, tx pgx.Tx) error

	// User operations
	GetUserByToken(ctx context.Context, tx pgx.Tx, token string) (*models.User, error)
	GetUserByIDForUpdate(ctx context.Context, tx pgx.Tx, id string) (*models.User, error)
	GetUserByID(ctx context.Context, tx pgx.Tx, id string) (*models.User, error)
	InsertUser(ctx context.Context, tx pgx.Tx, user *models.User) error
	GetUserByQRCode(ctx context.Context, tx pgx.Tx, qr string) (*models.User, error)

	// Friend operations
	CountFriends(ctx context.Context, tx pgx.Tx, userID string) (int, error)
	AddFriend(ctx context.Context, tx pgx.Tx, userID, friendID string) (bool, error)
	ListFriends(ctx context.Context, tx pgx.Tx, userID string) ([]models.User, error)

	// Game operations
	IncrementUnlockLevel(ctx context.Context, tx pgx.Tx, userID string) error
	GetTopUsers(ctx context.Context, tx pgx.Tx, limit, offset int) ([]models.User, error)
	UpdateCurrentLevel(ctx context.Context, tx pgx.Tx, userID string, newLevel int) error
	GetUserWithRank(ctx context.Context, tx pgx.Tx, userID string) (*models.User, int, error)
	GetAroundUsers(ctx context.Context, tx pgx.Tx, userID string, span int) ([]models.User, error)

	// Activity operations
	CountVisitedActivities(ctx context.Context, tx pgx.Tx, userID string) (int, error)
	GetActivityByQRCode(ctx context.Context, tx pgx.Tx, qr string) (*models.Activities, error)
	GetActivityByID(ctx context.Context, tx pgx.Tx, id string) (*models.Activities, error)
	GetActivityByToken(ctx context.Context, tx pgx.Tx, token string) (*models.Activities, error)
	AddVisited(ctx context.Context, tx pgx.Tx, userID, activityID string) (bool, error)
	CountVisitedByActivity(ctx context.Context, tx pgx.Tx, activityID string) (int, error)
	ListActivities(ctx context.Context, tx pgx.Tx) ([]models.Activities, error)
	ListVisitedActivityIDs(ctx context.Context, tx pgx.Tx, userID string) ([]string, error)

	// Discount operations
	CreateDiscountCoupon(ctx context.Context, tx pgx.Tx, userID string, price int, discountID string, maxQty int) (*models.DiscountCoupon, bool, error)
	GetDiscountByToken(ctx context.Context, tx pgx.Tx, token string) (*models.DiscountCoupon, error)
	MarkDiscountUsed(ctx context.Context, tx pgx.Tx, id string) (*models.DiscountCoupon, error)
	ListDiscountsByUser(ctx context.Context, tx pgx.Tx, userID string) ([]models.DiscountCoupon, error)
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
