package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/silentsage432/sage-gitops/onboarding/backend/middleware"
)

// getDB gets database connection from context, falling back to global dbPool
// This maintains backward compatibility with handlers that don't use federation routing
func getDB(ctx context.Context) *pgxpool.Pool {
	db, err := middleware.GetDBFromContext(ctx)
	if err == nil && db != nil {
		return db
	}
	// Fallback to global dbPool for backward compatibility
	return dbPool
}

// getDBOrFail gets database connection from context, returns error if not found
// Use this when DB is required (federation routes)
func getDBOrFail(ctx context.Context) (*pgxpool.Pool, error) {
	db, err := middleware.GetDBFromContext(ctx)
	if err == nil && db != nil {
		return db, nil
	}
	// Fallback to global dbPool for backward compatibility
	if dbPool != nil {
		return dbPool, nil
	}
	return nil, err
}

