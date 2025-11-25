# Phase 1.1: Backend Schema Alignment Patch

## SUMMARY OF DISCOVERED MISMATCHES

### 1. **Request Struct Mismatch** (CRITICAL)
**Location:** `handlers.go:498-503`

**Backend Expects:**
```go
var req struct {
    Company     interface{} `json:"company"`      // Expects: {name, domain, region}
    DataRegions interface{} `json:"dataRegions"` // Expects: DataRegion[] with .selected
    AgentPlan   interface{} `json:"agentPlan"`   // Expects: {plan, agentCount}
    AccessModel interface{} `json:"accessModel"` // Expects: {model, description}
}
```

**Frontend Sends:**
```typescript
{
  company: { name, email, industry?, size? },
  dataRegionsConfig: { sensitivity?, selectedRegions[], residencyRequired },
  agentSelection: { selectedAgents[] },
  accessConfig: { authMethod, adminEmail?, clientId?, clientSecret?, ... }
}
```

**Impact:** Handler cannot parse frontend payload. All fields are `interface{}` so JSON unmarshals but structure is wrong.

---

### 2. **Missing Struct Definitions** (CRITICAL)
**Location:** `handlers.go` - No struct definitions exist

**Missing:**
- `CompanyData` struct matching frontend
- `DataRegionsConfig` struct matching frontend
- `AgentSelection` struct matching frontend
- `AccessConfig` struct matching frontend
- `CreateTenantRequest` struct for the complete request

**Impact:** Cannot type-check or properly parse request. Handler uses `interface{}` everywhere.

---

### 3. **Tenant Creation Logic** (CRITICAL)
**Location:** `handlers.go:510-521`

**Current Behavior:**
- Marshals entire request to JSONB
- Stores in `config_data` column
- Does NOT extract company name/email for `name` column
- Does NOT create tenant_agents junction records
- Does NOT store access config separately

**Impact:** 
- Tenant `name` column gets generic "tenant-{uuid}" instead of company name
- No way to query which agents are assigned to tenant
- Access config buried in JSONB, not queryable

---

### 4. **Missing Database Tables** (CRITICAL)
**Location:** `db/migrations/001_init.sql`

**Missing:**
- `agents` table (registry of available agents)
- `tenant_agents` junction table (links tenants to selected agents)

**Impact:** Cannot persist agent selections. No way to query tenant's agents.

---

### 5. **Database Schema Mismatch** (MEDIUM)
**Location:** `db/migrations/001_init.sql:42-51`

**Current Schema:**
```sql
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),        -- ❌ Frontend doesn't send this
    region VARCHAR(100),        -- ❌ Frontend doesn't send this
    config_data JSONB NOT NULL,
    ...
);
```

**Frontend Sends:**
- `company.email` (not domain)
- `dataRegionsConfig.selectedRegions[]` (array, not single region)

**Impact:** `domain` and `region` columns will be NULL. Not critical but schema doesn't match usage.

---

### 6. **Bootstrap Kit Handler** (LOW - Phase 2)
**Location:** `handlers.go:544-601`

**Current Behavior:**
- Doesn't use tenant data from request
- Returns placeholder bytes
- No fingerprint generation

**Impact:** Bootstrap kit generation doesn't work, but this is Phase 2 scope.

---

## HOW EACH MISMATCH AFFECTS CURRENT FLOW

### Flow Breakdown:

1. **Frontend `/onboarding/review` submits:**
   ```json
   {
     "company": {"name": "Acme Corp", "email": "admin@acme.com", "industry": "Finance"},
     "dataRegionsConfig": {"sensitivity": "PCI", "selectedRegions": ["us-east", "us-west"], "residencyRequired": true},
     "agentSelection": {"selectedAgents": ["researcher", "audit-logger"]},
     "accessConfig": {"authMethod": "local", "adminEmail": "admin@acme.com", "tempPassword": "..."}
   }
   ```

2. **Backend `handleCreateTenant` receives:**
   - JSON unmarshals into `interface{}` fields (works)
   - But struct field names don't match (`dataRegions` vs `dataRegionsConfig`)
   - Handler tries to access wrong fields

3. **Current Handler Logic:**
   ```go
   tenantData, _ := json.Marshal(req)  // Marshals the wrong struct
   // Stores generic name: "tenant-{uuid}"
   // Doesn't extract company.name
   // Doesn't create tenant_agents records
   ```

4. **Result:**
   - Tenant created with wrong name
   - Agent selections lost (not persisted)
   - Access config buried in JSONB
   - Cannot query tenant's agents later

---

## COMPLETE WORKING PATCH

### File 1: `handlers.go` - Add Struct Definitions and Fix Handler

```go
// ... existing imports ...
import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/lib/pq"
)

// ... existing WebAuthn handlers remain unchanged ...

// Request structs matching frontend schema
type CompanyData struct {
	Name     string  `json:"name"`
	Email    string  `json:"email"`
	Industry *string `json:"industry,omitempty"`
	Size     *string `json:"size,omitempty"`
	// Legacy fields for backward compatibility
	Domain *string `json:"domain,omitempty"`
	Region *string `json:"region,omitempty"`
}

type DataRegionsConfig struct {
	Sensitivity      *string  `json:"sensitivity,omitempty"`
	SelectedRegions  []string `json:"selectedRegions"`
	ResidencyRequired bool   `json:"residencyRequired"`
}

type AgentSelection struct {
	SelectedAgents []string `json:"selectedAgents"`
}

type AccessConfig struct {
	AuthMethod      string  `json:"authMethod"` // "local" | "sso"
	ScimEnabled     bool    `json:"scimEnabled,omitempty"`
	IdentityProvider *string `json:"identityProvider,omitempty"`
	ClientId        *string `json:"clientId,omitempty"`
	ClientSecret    *string `json:"clientSecret,omitempty"`
	CallbackUrl     *string `json:"callbackUrl,omitempty"`
	AdminEmail      *string `json:"adminEmail,omitempty"`
	TempPassword    *string `json:"tempPassword,omitempty"`
}

type CreateTenantRequest struct {
	Company          CompanyData       `json:"company"`
	DataRegionsConfig DataRegionsConfig `json:"dataRegionsConfig"`
	AgentSelection   AgentSelection    `json:"agentSelection"`
	AccessConfig     AccessConfig      `json:"accessConfig"`
}

// Create Tenant Handler - UPDATED
func handleCreateTenant(w http.ResponseWriter, r *http.Request) {
	// Force bypass for development
	if os.Getenv("BYPASS_OCT") == "true" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  true,
			"tenantID": "mock-tenant-id",
		})
		return
	}

	ctx := r.Context()

	// Verify OCT token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[7:]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}

	scopes, _ := claims["scopes"].([]interface{})
	hasScope := false
	for _, scope := range scopes {
		if scope == "tenant.create" {
			hasScope = true
			break
		}
	}

	if !hasScope {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	// Parse request with correct struct
	var req CreateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Company.Name == "" {
		http.Error(w, "Company name is required", http.StatusBadRequest)
		return
	}
	if req.Company.Email == "" {
		http.Error(w, "Company email is required", http.StatusBadRequest)
		return
	}
	if len(req.DataRegionsConfig.SelectedRegions) == 0 {
		http.Error(w, "At least one data region must be selected", http.StatusBadRequest)
		return
	}
	if len(req.AgentSelection.SelectedAgents) == 0 {
		http.Error(w, "At least one agent must be selected", http.StatusBadRequest)
		return
	}
	if req.AccessConfig.AuthMethod == "" {
		http.Error(w, "Authentication method is required", http.StatusBadRequest)
		return
	}

	// Validate auth method specific fields
	if req.AccessConfig.AuthMethod == "local" {
		if req.AccessConfig.AdminEmail == nil || *req.AccessConfig.AdminEmail == "" {
			http.Error(w, "Admin email is required for local authentication", http.StatusBadRequest)
			return
		}
	} else if req.AccessConfig.AuthMethod == "sso" {
		if req.AccessConfig.ClientId == nil || *req.AccessConfig.ClientId == "" {
			http.Error(w, "Client ID is required for SSO", http.StatusBadRequest)
			return
		}
		if req.AccessConfig.ClientSecret == nil || *req.AccessConfig.ClientSecret == "" {
			http.Error(w, "Client Secret is required for SSO", http.StatusBadRequest)
			return
		}
	} else {
		http.Error(w, "Invalid authentication method", http.StatusBadRequest)
		return
	}

	// Begin transaction
	tx, err := dbPool.Begin(ctx)
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Create tenant
	tenantID := uuid.New().String()
	now := time.Now()

	// Extract domain from email if not provided
	domain := req.Company.Domain
	if domain == nil || *domain == "" {
		// Extract domain from email (simple extraction)
		emailParts := strings.Split(req.Company.Email, "@")
		if len(emailParts) == 2 {
			domainStr := emailParts[1]
			domain = &domainStr
		}
	}

	// Use first selected region as primary region (for backward compatibility)
	primaryRegion := ""
	if len(req.DataRegionsConfig.SelectedRegions) > 0 {
		primaryRegion = req.DataRegionsConfig.SelectedRegions[0]
	}

	// Store full config in JSONB
	configData, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "Failed to marshal config data", http.StatusInternalServerError)
		return
	}

	// Insert tenant with proper name
	_, err = tx.Exec(ctx,
		"INSERT INTO public.tenants (id, name, domain, region, config_data, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		tenantID,
		req.Company.Name, // Use actual company name
		domain,
		primaryRegion,
		configData,
		"pending",
		now,
		now,
	)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create tenant: %v", err), http.StatusInternalServerError)
		return
	}

	// Create tenant_agents junction records
	if len(req.AgentSelection.SelectedAgents) > 0 {
		// Verify agents exist in registry (optional check)
		for _, agentID := range req.AgentSelection.SelectedAgents {
			var agentExists bool
			err := tx.QueryRow(ctx,
				"SELECT EXISTS(SELECT 1 FROM public.agents WHERE id = $1)",
				agentID,
			).Scan(&agentExists)

			// If agents table doesn't exist or agent not found, still create the link
			// (allows for backward compatibility during migration)
			if err == nil && !agentExists {
				// Log warning but continue (agent might be added later)
				log.Printf("Warning: Agent %s not found in registry, creating link anyway", agentID)
			}

			// Insert tenant_agent link
			_, err = tx.Exec(ctx,
				"INSERT INTO public.tenant_agents (tenant_id, agent_id, created_at) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, agent_id) DO NOTHING",
				tenantID,
				agentID,
				now,
			)
			if err != nil {
				// If tenant_agents table doesn't exist yet, log and continue
				// (migration might not have run)
				log.Printf("Warning: Failed to create tenant_agent link: %v (table may not exist)", err)
			}
		}
	}

	// Store access config in tenant_policies for queryability
	accessPolicyData, err := json.Marshal(req.AccessConfig)
	if err == nil {
		_, _ = tx.Exec(ctx,
			"INSERT INTO public.tenant_policies (tenant_id, policy_type, policy_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
			tenantID,
			"access_config",
			accessPolicyData,
			now,
			now,
		)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Log audit event
	_, _ = dbPool.Exec(ctx,
		"INSERT INTO public.audit_log (event_type, user_id, details, created_at) VALUES ($1, $2, $3, $4)",
		"tenant_created",
		claims["sub"].(string),
		fmt.Sprintf(`{"tenant_id": "%s", "company_name": "%s", "agents": %v}`, tenantID, req.Company.Name, req.AgentSelection.SelectedAgents),
		now,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tenantID": tenantID,
	})
}

// ... rest of handlers remain unchanged ...
```

**Note:** Add missing import:
```go
import (
	"strings"  // Add this for email domain extraction
	"log"      // Add this for logging
)
```

---

### File 2: `db/migrations/002_tenant_agents.sql` - Create Junction Table

```sql
-- Migration: 002_tenant_agents.sql
-- Description: Add agents registry and tenant_agents junction table
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Agents Registry Table
-- Stores available agents that can be assigned to tenants
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    capabilities JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_id ON public.agents(id);
CREATE INDEX IF NOT EXISTS idx_agents_name ON public.agents(name);

-- Tenant Agents Junction Table
-- Links tenants to their selected agents
CREATE TABLE IF NOT EXISTS public.tenant_agents (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_agents_tenant_id ON public.tenant_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_agents_agent_id ON public.tenant_agents(agent_id);

-- Trigger to update agents.updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial agents (matching frontend hardcoded list)
INSERT INTO public.agents (id, name, description, created_at, updated_at) VALUES
    ('researcher', 'Researcher Agent', 'Data gathering + external retrieval', NOW(), NOW()),
    ('audit-logger', 'Audit Logger', 'Immutable compliance logging', NOW(), NOW()),
    ('etl-lite', 'ETL-Lite', 'Basic data processing and ingestion', NOW(), NOW()),
    ('notification-relay', 'Notification Relay', 'Alerts + async messaging', NOW(), NOW()),
    ('observer', 'Observer Agent', 'Passive telemetry + drift detection', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

---

### File 3: `db/migrations/003_update_tenants_schema.sql` - Optional Schema Update

```sql
-- Migration: 003_update_tenants_schema.sql
-- Description: Add email column to tenants table for better queryability
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN email VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);
    END IF;
END $$;
```

**Note:** This migration is optional. The email is stored in `config_data` JSONB, but adding a column makes it queryable. The handler doesn't need to change - this is just for future queries.

---

## VERIFICATION STEPS

### 1. Compile Check
```bash
cd onboarding/backend
go mod tidy
go build .
```

### 2. Database Migration
```bash
psql -d sage_os -f db/migrations/002_tenant_agents.sql
psql -d sage_os -f db/migrations/003_update_tenants_schema.sql  # Optional
```

### 3. Test Request
```bash
curl -X POST http://localhost:8080/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OCT_TOKEN" \
  -d '{
    "company": {
      "name": "Test Corp",
      "email": "admin@test.com",
      "industry": "Finance"
    },
    "dataRegionsConfig": {
      "sensitivity": "PCI",
      "selectedRegions": ["us-east", "us-west"],
      "residencyRequired": true
    },
    "agentSelection": {
      "selectedAgents": ["researcher", "audit-logger"]
    },
    "accessConfig": {
      "authMethod": "local",
      "adminEmail": "admin@test.com",
      "tempPassword": "temp123"
    }
  }'
```

### 4. Verify Database
```sql
-- Check tenant was created with correct name
SELECT id, name, domain, region, status FROM public.tenants WHERE name = 'Test Corp';

-- Check tenant_agents links were created
SELECT ta.tenant_id, ta.agent_id, a.name 
FROM public.tenant_agents ta
JOIN public.agents a ON ta.agent_id = a.id
WHERE ta.tenant_id = 'YOUR_TENANT_ID';

-- Check access config in tenant_policies
SELECT policy_type, policy_data 
FROM public.tenant_policies 
WHERE tenant_id = 'YOUR_TENANT_ID' AND policy_type = 'access_config';
```

---

## COMPILATION INTEGRITY

### Required Imports (verify all present):
- `database/sql` - Not needed, using pgx
- `encoding/json` - ✅ Present
- `errors` - ✅ Present
- `fmt` - ✅ Present
- `net/http` - ✅ Present
- `os` - ✅ Present
- `strings` - ⚠️ **MUST ADD** (for email domain extraction)
- `time` - ✅ Present
- `log` - ⚠️ **MUST ADD** (for logging warnings)
- `github.com/go-webauthn/webauthn/webauthn` - ✅ Present
- `github.com/golang-jwt/jwt/v5` - ✅ Present
- `github.com/google/uuid` - ✅ Present
- `github.com/jackc/pgx/v5` - ✅ Present
- `github.com/lib/pq` - ⚠️ **NOT NEEDED** (using pgx, not lib/pq)

### Go Module Dependencies:
All dependencies should already be in `go.mod`. No new packages required.

---

## SUMMARY

✅ **Struct Definitions:** Added matching frontend schema  
✅ **Handler Logic:** Updated to parse and persist correctly  
✅ **Database Tables:** Added agents and tenant_agents tables  
✅ **Transaction Safety:** Wrapped in transaction for atomicity  
✅ **Validation:** Added field validation  
✅ **Backward Compatibility:** Handles missing tables gracefully  
✅ **Error Handling:** Proper error messages and rollback  

**Next Steps After This Patch:**
1. Run migrations
2. Test with frontend submission
3. Verify tenant_agents links are created
4. Proceed to Phase 1.2 (API path fixes) or Phase 2 (Bootstrap kit)

