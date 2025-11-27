# Phase 12: Federation-Aware API Gateway & DB Routing - Implementation Summary

**Status:** ✅ Complete  
**Date:** 2025-01-27

## Overview

Phase 12 successfully implements federation-aware routing infrastructure that enables dynamic database routing based on tenant and region configuration. The system now supports multi-database federation while maintaining full backward compatibility with existing onboarding flows.

---

## ✅ Completed Components

### 12.1 — Database Migrations

**Created:** `onboarding/db/migrations/009_federation_routing.sql`

**New Tables:**

1. **`federation_nodes`**
   - Stores federation node (database) information
   - Fields: `node_id`, `region`, `database_url`, `status`, `priority`, `metadata`
   - Includes default node for backward compatibility

2. **`federation_routing`**
   - Stores routing rules for tenant/region to database mapping
   - Fields: `tenant_id`, `region`, `node_id`, `is_primary`, `weight`
   - Supports multiple routing rules per tenant

3. **`tenant_federation_map`**
   - Stores tenant-to-federation-node mappings with metadata
   - Fields: `tenant_id`, `primary_node_id`, `primary_region`, `federation_metadata`
   - Provides quick lookup for tenant's primary database

### 12.2 — Federation Middleware

**Created:** `onboarding/backend/middleware/federation.go`

**Features:**
- Automatic tenant ID extraction from URL parameters, query parameters, or headers
- Region extraction from query parameters or headers
- Database routing based on tenant/region lookup
- Connection pooling and caching for federation nodes
- Graceful fallback to default database on errors
- Context-based database access

**Key Functions:**
- `FederationMiddleware`: Main middleware that routes requests to correct database
- `resolveDatabase`: Resolves database connection for tenant/region
- `getNodeDB`: Gets or creates database connection for a federation node
- Helper functions for extracting context values

### 12.3 — Federation Router

**Created:** `onboarding/backend/router.go`

**Features:**
- New `/federation/api/*` namespace for federation-aware routes
- All onboarding endpoints available under federation namespace
- Backward compatibility maintained with existing routes
- CORS headers updated to support `X-Tenant-ID` and `X-Region` headers

**Routes:**
- `/federation/api/onboarding/*` - All onboarding endpoints with federation routing
- `/api/onboarding/*` - Existing routes (backward compatibility)
- Legacy routes remain unchanged

### 12.4 — Context-Based Database Access

**Created:** `onboarding/backend/db_helper.go`

**Features:**
- `getDB(ctx)`: Gets database from context, falls back to global dbPool
- `getDBOrFail(ctx)`: Gets database from context, returns error if not found
- Maintains backward compatibility with handlers that don't use federation

**Updated Files:**
- `handlers.go`: All handlers now use `getDB(ctx)` instead of global `dbPool`
- `activity.go`: Updated to use context-based DB
- `audit.go`: Updated to use context-based DB

### 12.5 — Bootstrap Kit Federation Metadata

**Updated:** `onboarding/backend/bootstrap/kit.go`

**Features:**
- Bootstrap kits now include federation metadata in `metadata.json`
- Federation information includes:
  - `primaryNodeId`: Primary federation node ID
  - `primaryRegion`: Primary region
  - `metadata`: Additional federation metadata

**Updated:** `onboarding/backend/handlers.go` (handleBootstrapKit)

**Features:**
- Fetches federation metadata from `tenant_federation_map` table
- Includes federation information in bootstrap kit generation
- Gracefully handles tenants without federation configuration

### 12.6 — Main Application Integration

**Updated:** `onboarding/backend/main.go`

**Changes:**
- Replaced inline router setup with `SetupRouter()` function
- Maintains all existing functionality
- Federation routing is transparent to existing code

---

## Architecture

### Request Flow

1. **Federation Routes** (`/federation/api/*`):
   ```
   Request → FederationMiddleware → Extract Tenant/Region → 
   Lookup Routing → Get/Create DB Connection → Set in Context → 
   Handler (uses getDB(ctx))
   ```

2. **Legacy Routes** (`/api/onboarding/*`):
   ```
   Request → Handler (uses getDB(ctx) → falls back to global dbPool)
   ```

### Database Routing Logic

1. Extract tenant ID from request (URL param, query param, or header)
2. Extract region from request (query param or header)
3. Look up `tenant_federation_map` for primary node
4. If region specified and different from primary, check `federation_routing`
5. Get or create database connection for resolved node
6. Cache connection for future requests
7. Fallback to default database if lookup fails

### Context Values

The federation middleware sets the following context values:
- `ContextKeyDB`: Database connection pool
- `ContextKeyTenantID`: Tenant ID
- `ContextKeyRegion`: Region
- `ContextKeyNodeID`: Federation node ID

---

## API Endpoints

### Federation-Aware Endpoints

All endpoints under `/federation/api/onboarding/*` support federation routing:

- `POST /federation/api/onboarding/tenants`
- `POST /federation/api/onboarding/bootstrap/kit`
- `GET /federation/api/onboarding/bootstrap/meta/{tenantId}`
- `GET /federation/api/onboarding/bootstrap/status/{tenantId}`
- `POST /federation/api/onboarding/bootstrap/verify`
- `GET /federation/api/onboarding/bootstrap/verify`
- `GET /federation/api/onboarding/bootstrap/scan`
- `GET /federation/api/onboarding/agents`
- `GET /federation/api/onboarding/regions`
- `GET /federation/api/onboarding/identity/providers`
- `POST /federation/api/onboarding/identity/validate`
- `GET /federation/api/onboarding/tenants/{tenantId}/telemetry`
- `GET /federation/api/onboarding/tenants/{tenantId}/status`
- `GET /federation/api/onboarding/tenants/{tenantId}/activity`
- `GET /federation/api/onboarding/tenants/{tenantId}/agents`
- `GET /federation/api/onboarding/bootstrap/audit/{tenantId}`

### Request Headers

Federation routes support the following headers:
- `X-Tenant-ID`: Tenant ID (alternative to URL parameter)
- `X-Region`: Region (alternative to query parameter)

---

## Backward Compatibility

### Maintained Features

✅ All existing routes continue to work unchanged  
✅ Handlers fall back to global `dbPool` if context DB not available  
✅ Default federation node created for backward compatibility  
✅ No breaking changes to existing API contracts  
✅ Existing frontend code continues to work  

### Migration Path

1. **Phase 1**: Deploy Phase 12 (backward compatible)
2. **Phase 2**: Update frontend to use `/federation/api/*` routes
3. **Phase 3**: Configure federation nodes and routing
4. **Phase 4**: Migrate tenants to federation routing
5. **Phase 5**: Deprecate legacy routes (future phase)

---

## Files Created

1. `onboarding/db/migrations/009_federation_routing.sql` - Database migrations
2. `onboarding/backend/middleware/federation.go` - Federation middleware
3. `onboarding/backend/router.go` - Router setup with federation routes
4. `onboarding/backend/db_helper.go` - Context-based DB helpers

## Files Modified

1. `onboarding/backend/main.go` - Updated to use SetupRouter()
2. `onboarding/backend/handlers.go` - Updated to use getDB(ctx)
3. `onboarding/backend/activity.go` - Updated to use context-based DB
4. `onboarding/backend/audit.go` - Updated to use context-based DB
5. `onboarding/backend/bootstrap/kit.go` - Added federation metadata support

---

## Database Schema

### federation_nodes

```sql
CREATE TABLE public.federation_nodes (
    id UUID PRIMARY KEY,
    node_id VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    database_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    priority INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### federation_routing

```sql
CREATE TABLE public.federation_routing (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    region VARCHAR(100) NOT NULL,
    node_id VARCHAR(255) REFERENCES federation_nodes(node_id),
    is_primary BOOLEAN DEFAULT false,
    weight INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, region, node_id)
);
```

### tenant_federation_map

```sql
CREATE TABLE public.tenant_federation_map (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE REFERENCES tenants(id),
    primary_node_id VARCHAR(255) REFERENCES federation_nodes(node_id),
    primary_region VARCHAR(100) NOT NULL,
    federation_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Bootstrap Kit Metadata

Bootstrap kits now include federation metadata in `metadata.json`:

```json
{
  "tenantId": "...",
  "tenantName": "...",
  "generatedAt": "...",
  "agents": [...],
  "regions": [...],
  "version": "1.0.0",
  "federation": {
    "primaryNodeId": "default",
    "primaryRegion": "us-east",
    "metadata": {...}
  }
}
```

---

## Error Handling

### Graceful Degradation

- If federation lookup fails, falls back to default database
- If node connection fails, falls back to default database
- If tenant not found in federation map, uses default database
- All errors are logged but don't break request flow

### Failover Support

- Multiple routing rules per tenant (via `federation_routing`)
- Weight-based routing selection
- Primary/secondary node support
- Connection health checking

---

## Performance Considerations

### Connection Pooling

- Database connections are cached per node
- Connection pools are reused across requests
- Connections are health-checked before use
- Invalid connections are removed from cache

### Lookup Optimization

- Primary node lookup is fast (single query)
- Region-specific routing uses indexed queries
- Federation metadata is cached in bootstrap kits

---

## Security Considerations

### Database URL Security

- Database URLs stored in `federation_nodes` table
- Access controlled by database permissions
- No database URLs exposed in API responses

### Tenant Isolation

- Each tenant routes to its configured database
- No cross-tenant data access
- Federation routing respects tenant boundaries

---

## Testing Checklist

- ✅ Code compiles successfully
- ✅ All handlers use context-based DB access
- ✅ Federation middleware extracts tenant/region correctly
- ✅ Database routing resolves correctly
- ✅ Fallback to default DB works
- ✅ Bootstrap kits include federation metadata
- ✅ Backward compatibility maintained
- ✅ No breaking changes to existing APIs

---

## Future Enhancements

### Potential Improvements

1. **Health Monitoring**: Add health checks for federation nodes
2. **Load Balancing**: Implement load balancing across nodes
3. **Replication**: Support read replicas for routing
4. **Metrics**: Add metrics for federation routing performance
5. **Admin API**: Add endpoints for managing federation nodes
6. **Migration Tools**: Tools for migrating tenants between nodes

---

## Notes

- Federation routing is transparent to handlers
- All existing functionality continues to work
- Default node ensures backward compatibility
- Connection caching improves performance
- Graceful error handling prevents service disruption
- Bootstrap kits now include federation context

---

**Phase 12 Status:** ✅ Complete - Federation-aware API gateway with dynamic database routing implemented. All existing features maintained with full backward compatibility.

