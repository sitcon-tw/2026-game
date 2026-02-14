package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sitcon-tw/2026-game/internal/models"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
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
	GetUserByCouponToken(ctx context.Context, tx pgx.Tx, couponToken string) (*models.User, error)
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
	GetAroundUsers(
		ctx context.Context,
		tx pgx.Tx,
		userID string,
		span int,
	) ([]models.User, error)

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
	CreateDiscountCoupon(
		ctx context.Context,
		tx pgx.Tx,
		userID string,
		price int,
		discountID string,
		maxQty int,
	) (*models.DiscountCoupon, bool, error)
	MarkDiscountUsed(ctx context.Context, tx pgx.Tx, id string, staffID string) (*models.DiscountCoupon, error)
	MarkDiscountsUsedByUser(
		ctx context.Context,
		tx pgx.Tx,
		userID string,
		staffID string,
		historyID string,
		usedAt time.Time,
	) ([]models.DiscountCoupon, error)
	ListDiscountsByUser(ctx context.Context, tx pgx.Tx, userID string) ([]models.DiscountCoupon, error)
	CountDiscountCouponsByDiscountIDs(
		ctx context.Context,
		tx pgx.Tx,
		discountIDs []string,
	) (map[string]int, error)
	InsertCouponHistory(ctx context.Context, tx pgx.Tx, history *models.CouponHistory) error
	ListUnusedDiscountsByUser(ctx context.Context, tx pgx.Tx, userID string) ([]models.DiscountCoupon, error)
	ListCouponHistoryByStaff(ctx context.Context, tx pgx.Tx, staffID string) ([]models.CouponHistory, error)

	// Staff operations
	GetStaffByToken(ctx context.Context, tx pgx.Tx, token string) (*models.Staff, error)
}

// PGRepository is the production repository backed by pgx.
type PGRepository struct {
	DB     *pgxpool.Pool
	Logger *zap.Logger
	tracer trace.Tracer
}

// New creates a repository backed by pgx pool.
func New(db *pgxpool.Pool, logger *zap.Logger) Repository {
	return &PGRepository{
		DB:     db,
		Logger: logger,
		tracer: otel.Tracer("github.com/sitcon-tw/2026-game/repository"),
	}
}
