package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// ContextKeyDB is the context key for database connection
	ContextKeyDB ContextKey = "db"
	// ContextKeyTenantID is the context key for tenant ID
	ContextKeyTenantID ContextKey = "tenant_id"
	// ContextKeyRegion is the context key for region
	ContextKeyRegion ContextKey = "region"
	// ContextKeyNodeID is the context key for federation node ID
	ContextKeyNodeID ContextKey = "node_id"
)

// FederationRouter handles tenant/region lookup and database routing
type FederationRouter struct {
	defaultDB *pgxpool.Pool
	nodeCache map[string]*pgxpool.Pool // Cache of node_id -> DB pool
}

// NewFederationRouter creates a new federation router
func NewFederationRouter(defaultDB *pgxpool.Pool) *FederationRouter {
	return &FederationRouter{
		defaultDB: defaultDB,
		nodeCache: make(map[string]*pgxpool.Pool),
	}
}

// FederationMiddleware extracts tenant/region and routes to correct database
func (fr *FederationRouter) FederationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Extract tenant ID from URL or header
		tenantID := fr.extractTenantID(r)
		region := fr.extractRegion(r)

		// If no tenant ID, use default DB (backward compatibility)
		if tenantID == "" {
			ctx = context.WithValue(ctx, ContextKeyDB, fr.defaultDB)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Look up routing configuration
		db, nodeID, err := fr.resolveDatabase(ctx, tenantID, region)
		if err != nil {
			log.Printf("Federation routing error for tenant %s: %v", tenantID, err)
			// Fallback to default DB on error
			ctx = context.WithValue(ctx, ContextKeyDB, fr.defaultDB)
			ctx = context.WithValue(ctx, ContextKeyTenantID, tenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Set context values
		ctx = context.WithValue(ctx, ContextKeyDB, db)
		ctx = context.WithValue(ctx, ContextKeyTenantID, tenantID)
		if region != "" {
			ctx = context.WithValue(ctx, ContextKeyRegion, region)
		}
		if nodeID != "" {
			ctx = context.WithValue(ctx, ContextKeyNodeID, nodeID)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// extractTenantID extracts tenant ID from request
func (fr *FederationRouter) extractTenantID(r *http.Request) string {
	// Try URL parameter first (chi router)
	if tenantID := chi.URLParam(r, "tenantId"); tenantID != "" {
		return tenantID
	}

	// Try query parameter
	if tenantID := r.URL.Query().Get("tenantId"); tenantID != "" {
		return tenantID
	}

	// Try header
	if tenantID := r.Header.Get("X-Tenant-ID"); tenantID != "" {
		return tenantID
	}

	return ""
}

// extractRegion extracts region from request
func (fr *FederationRouter) extractRegion(r *http.Request) string {
	// Try query parameter
	if region := r.URL.Query().Get("region"); region != "" {
		return region
	}

	// Try header
	if region := r.Header.Get("X-Region"); region != "" {
		return region
	}

	return ""
}

// resolveDatabase resolves the correct database for tenant/region
func (fr *FederationRouter) resolveDatabase(ctx context.Context, tenantID, region string) (*pgxpool.Pool, string, error) {
	// First, check tenant_federation_map for primary node
	var primaryNodeID, primaryRegion string
	err := fr.defaultDB.QueryRow(ctx,
		`SELECT primary_node_id, primary_region 
		 FROM public.tenant_federation_map 
		 WHERE tenant_id = $1`,
		tenantID,
	).Scan(&primaryNodeID, &primaryRegion)

	if err == nil {
		// If region matches or no region specified, use primary node
		if region == "" || region == primaryRegion {
			db, err := fr.getNodeDB(ctx, primaryNodeID)
			if err == nil {
				return db, primaryNodeID, nil
			}
		}
	}

	// If region specified and different from primary, check federation_routing
	if region != "" && region != primaryRegion {
		var nodeID string
		err := fr.defaultDB.QueryRow(ctx,
			`SELECT node_id 
			 FROM public.federation_routing 
			 WHERE tenant_id = $1 AND region = $2 AND is_primary = true
			 ORDER BY weight DESC
			 LIMIT 1`,
			tenantID,
			region,
		).Scan(&nodeID)

		if err == nil {
			db, err := fr.getNodeDB(ctx, nodeID)
			if err == nil {
				return db, nodeID, nil
			}
		}
	}

	// Fallback: use primary node if we found one
	if primaryNodeID != "" {
		db, err := fr.getNodeDB(ctx, primaryNodeID)
		if err == nil {
			return db, primaryNodeID, nil
		}
	}

	// Final fallback: default database
	return fr.defaultDB, "default", nil
}

// getNodeDB gets or creates a database connection for a node
func (fr *FederationRouter) getNodeDB(ctx context.Context, nodeID string) (*pgxpool.Pool, error) {
	// Check cache first
	if db, ok := fr.nodeCache[nodeID]; ok {
		// Verify connection is still valid
		if err := db.Ping(ctx); err == nil {
			return db, nil
		}
		// Connection invalid, remove from cache
		delete(fr.nodeCache, nodeID)
	}

	// Look up node configuration
	var databaseURL string
	var status string
	err := fr.defaultDB.QueryRow(ctx,
		`SELECT database_url, status 
		 FROM public.federation_nodes 
		 WHERE node_id = $1`,
		nodeID,
	).Scan(&databaseURL, &status)

	if err != nil {
		return nil, fmt.Errorf("federation node not found: %w", err)
	}

	if status != "active" {
		return nil, fmt.Errorf("federation node is not active: %s", status)
	}

	// Create new connection pool
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection: %w", err)
	}

	// Test connection
	if err := db.Ping(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Cache the connection
	fr.nodeCache[nodeID] = db

	return db, nil
}

// GetDBFromContext extracts database connection from context
func GetDBFromContext(ctx context.Context) (*pgxpool.Pool, error) {
	db, ok := ctx.Value(ContextKeyDB).(*pgxpool.Pool)
	if !ok || db == nil {
		return nil, fmt.Errorf("database connection not found in context")
	}
	return db, nil
}

// GetTenantIDFromContext extracts tenant ID from context
func GetTenantIDFromContext(ctx context.Context) string {
	tenantID, _ := ctx.Value(ContextKeyTenantID).(string)
	return tenantID
}

// GetRegionFromContext extracts region from context
func GetRegionFromContext(ctx context.Context) string {
	region, _ := ctx.Value(ContextKeyRegion).(string)
	return region
}

// GetNodeIDFromContext extracts node ID from context
func GetNodeIDFromContext(ctx context.Context) string {
	nodeID, _ := ctx.Value(ContextKeyNodeID).(string)
	return nodeID
}

// Close closes all cached database connections
func (fr *FederationRouter) Close() {
	for nodeID, db := range fr.nodeCache {
		db.Close()
		delete(fr.nodeCache, nodeID)
	}
}

