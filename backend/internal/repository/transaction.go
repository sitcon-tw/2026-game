package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

// StartTransaction return a tx
func (r *PGRepository) StartTransaction(ctx context.Context) (pgx.Tx, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}

	return tx, nil
}

// DeferRollback rollback the transaction if it's not already closed.
func (r *PGRepository) DeferRollback(ctx context.Context, tx pgx.Tx) {
	if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
		r.Logger.Error("Failed to rollback transaction", zap.Error(err))
	}
}

// CommitTransaction commit the transaction.
func (r *PGRepository) CommitTransaction(ctx context.Context, tx pgx.Tx) error {
	if err := tx.Commit(ctx); err != nil {
		r.Logger.Error("Failed to commit transaction", zap.Error(err))
		return err
	}
	return nil
}
