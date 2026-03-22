package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// TryAcquireAdvisoryXactLock acquires a transaction-scoped PostgreSQL advisory lock.
func (r *PGRepository) TryAcquireAdvisoryXactLock(ctx context.Context, tx pgx.Tx, key int64) (bool, error) {
	const query = `SELECT pg_try_advisory_xact_lock($1)`

	var locked bool
	if err := tx.QueryRow(ctx, query, key).Scan(&locked); err != nil {
		return false, err
	}

	return locked, nil
}
