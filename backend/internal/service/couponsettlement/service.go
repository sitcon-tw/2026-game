package couponsettlement

import (
	"context"
	"time"

	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap"
)

const (
	leaderboardSettlementLockKey int64 = 202603281600
	leaderboardFetchLimit              = 30
	leaderboardTopRankLimit            = 10
	settlementTimeout                  = time.Minute
)

type Service struct {
	Repo   repository.Repository
	Logger *zap.Logger
}

func New(repo repository.Repository, logger *zap.Logger) *Service {
	return &Service{Repo: repo, Logger: logger}
}

func (s *Service) StartScheduler(ctx context.Context) {
	stopAt, ok := config.Env().CouponStopAt()
	if !ok {
		s.Logger.Info("Coupon stop scheduler disabled; COUPON_STOP_TIME is not set")
		return
	}

	go s.run(ctx, stopAt)
}

func (s *Service) run(ctx context.Context, stopAt time.Time) {
	wait := time.Until(stopAt)
	if wait <= 0 {
		s.Logger.Info("Skipped coupon settlement scheduler because stop time has already passed")
		return
	}

	timer := time.NewTimer(wait)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return
	case <-timer.C:
	}

	settlementCtx, cancel := context.WithTimeout(ctx, settlementTimeout)
	defer cancel()

	if err := s.SettleLeaderboardTopTen(settlementCtx); err != nil {
		s.Logger.Error("Failed to settle leaderboard top ten coupons", zap.Error(err))
	}
}

func (s *Service) SettleLeaderboardTopTen(ctx context.Context) error {
	rule, ok := config.GetLeaderboardTopTenCouponRule()
	if !ok {
		s.Logger.Warn("Skipped leaderboard settlement because coupon rule is missing")
		return nil
	}

	tx, err := s.Repo.StartTransaction(ctx)
	if err != nil {
		return err
	}
	defer s.Repo.DeferRollback(ctx, tx)

	locked, err := s.Repo.TryAcquireAdvisoryXactLock(ctx, tx, leaderboardSettlementLockKey)
	if err != nil {
		return err
	}
	if !locked {
		s.Logger.Info("Skipped leaderboard settlement because another instance holds the lock")
		return nil
	}

	rows, err := s.Repo.GetTopUsers(ctx, tx, leaderboardFetchLimit, 0)
	if err != nil {
		return err
	}

	issuedCount := 0
	eligibleCount := 0
	for _, row := range rows {
		if row.Rank > leaderboardTopRankLimit {
			continue
		}

		eligibleCount++
		_, created, createErr := s.Repo.CreateDiscountCoupon(
			ctx,
			tx,
			row.User.ID,
			rule.Amount,
			config.DiscountIDLeaderboardTopTen,
		)
		if createErr != nil {
			return createErr
		}
		if created {
			issuedCount++
		}
	}

	if err = s.Repo.CommitTransaction(ctx, tx); err != nil {
		return err
	}

	s.Logger.Info(
		"Leaderboard top ten settlement completed",
		zap.Int("eligible_users", eligibleCount),
		zap.Int("issued_coupons", issuedCount),
	)

	return nil
}
