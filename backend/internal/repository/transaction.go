package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.uber.org/zap"
)

var txTracer = otel.Tracer("github.com/sitcon-tw/2026-game/repository")

// StartTransaction returns a transaction.
func (r *PGRepository) StartTransaction(ctx context.Context) (pgx.Tx, error) {
	ctx, span := txTracer.Start(ctx, "repository.tx.begin")
	defer span.End()

	tx, err := r.DB.Begin(ctx)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "begin transaction failed")
		return nil, err
	}

	return tx, nil
}

// DeferRollback rollback the transaction if it's not already closed.
func (r *PGRepository) DeferRollback(ctx context.Context, tx pgx.Tx) {
	ctx, span := txTracer.Start(ctx, "repository.tx.rollback")
	defer span.End()

	if err := tx.Rollback(ctx); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
		span.RecordError(err)
		span.SetStatus(codes.Error, "rollback failed")
		r.Logger.Error("Failed to rollback transaction", zap.Error(err))
		return
	}

	span.SetAttributes(attribute.Bool("tx.closed", true))
}

// CommitTransaction commit the transaction.
func (r *PGRepository) CommitTransaction(ctx context.Context, tx pgx.Tx) error {
	ctx, span := txTracer.Start(ctx, "repository.tx.commit")
	defer span.End()

	if err := tx.Commit(ctx); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "commit transaction failed")
		r.Logger.Error("Failed to commit transaction", zap.Error(err))
		return err
	}
	return nil
}
