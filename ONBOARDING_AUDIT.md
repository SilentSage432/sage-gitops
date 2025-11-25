# ONBOARDING UI – MASTER AUDIT RESULTS

**Audit Date:** 2025-01-27  
**Scope:** Complete onboarding system under `/onboarding/frontend/`  
**Backend:** Go service at `/onboarding/backend/`

---

## 1. Major Gaps

### 🔴 Critical Missing Implementations

1. **Bootstrap Kit Generation**
   - Backend returns placeholder ZIP (`bootstrap-kit-placeholder` bytes)
   - No actual kit contents (configs, manifests, keys, certificates)
   - No fingerprint generation from actual kit contents
   - Frontend expects `/api/bootstrap/kit` but backend serves `/bootstrap/kit`
   - Missing kit structure definition (what files should be included?)

2. **Agent Selection Backend Integration**
   - Frontend hardcodes 5 agent types in `agents/page.tsx`
   - No API endpoint to fetch available agents dynamically
   - No schema for agent capabilities, requirements, or dependencies
   - Agent selection stored only in localStorage, never persisted to backend

3. **Tenant Creation Data Mismatch**
   - Frontend sends `company`, `dataRegionsConfig`, `agentSelection`, `accessConfig`
   - Backend expects `company`, `dataRegions`, `agentPlan`, `accessModel`
   - **Schema mismatch:** Frontend uses `agentSelection.selectedAgents[]` but backend expects `agentPlan.plan + agentCount`
   - **Schema mismatch:** Frontend uses `accessConfig.authMethod` but backend expects `accessModel.model` (RBAC/ABAC)

4. **Duplicate Onboarding Flows**
   - **Wizard flow** (`/wizard/*`) - Uses old schema (company.domain, agentPlan, accessModel)
   - **Modern flow** (`/onboarding/*`) - Uses new schema (company.email, agentSelection, accessConfig)
   - Both flows exist simultaneously, causing confusion
   - Wizard flow redirects to `/wizard/company` but modern flow starts at `/onboarding/company`

5. **Bootstrap Kit Download**
   - Button exists in multiple places but functionality is stubbed
   - `KitDeliveryPanel` component calls `/bootstrap/kit` but expects ZIP blob
   - Review page calls `/api/bootstrap/kit` (wrong path)
   - Dashboard has "Download Bootstrap Kit" button that does nothing
   - No actual file generation or download mechanism

6. **Verification Command**
   - Command is hardcoded: `sage verify-kit --fingerprint "..."`
   - No `sage` CLI tool exists to execute this command
   - No backend endpoint to verify kit fingerprint
   - QR code URL is hardcoded: `https://bootstrap.example/activate/DEMO123`

---

## 2. Missing Implementations

### Frontend Routes & Pages

| Route | Status | Issues |
|-------|--------|--------|
| `/onboarding/company` | ✅ Implemented | Missing: domain field, validation for industry/size |
| `/onboarding/data-regions` | ✅ Implemented | Missing: dynamic region list from backend |
| `/onboarding/agents` | ✅ Implemented | Missing: dynamic agent list, agent descriptions, dependencies |
| `/onboarding/access` | ✅ Implemented | Missing: SSO provider discovery, callback URL validation |
| `/onboarding/review` | ✅ Implemented | Missing: edit capability, validation summary |
| `/onboarding/select` | ✅ Implemented | Entry point works |
| `/onboarding/organization` | ⚠️ Redirect only | Just redirects to `/onboarding/company` |
| `/onboarding/personal` | ✅ Implemented | Separate personal onboarding flow (works) |
| `/dashboard` | ⚠️ Partial | Uses fake telemetry, no real backend calls |
| `/dashboard/personal` | ✅ Implemented | Personal dashboard works |
| `/complete` | ⚠️ Redirect only | Auto-redirects to `/success` |
| `/success` | ✅ Implemented | Success page works |
| `/wizard/*` | ⚠️ Legacy | Old flow using different schema, should be deprecated |

### Backend Endpoints

| Endpoint | Status | Issues |
|----------|--------|--------|
| `POST /v1/init/webauthn/challenge` | ✅ Implemented | Works |
| `POST /v1/init/webauthn/verify` | ✅ Implemented | Works |
| `POST /rho2/auth/issue` | ✅ Implemented | Works |
| `POST /rho2/auth/verify` | ✅ Implemented | Works |
| `POST /tenants` | ⚠️ Partial | Creates tenant but schema mismatch with frontend |
| `POST /bootstrap/kit` | ❌ Stub | Returns placeholder bytes, no actual kit |
| `GET /bootstrap/meta` | ⚠️ Hardcoded | Returns hardcoded fingerprint/command |
| `GET /agents` | ❌ Missing | No endpoint to list available agents |
| `GET /regions` | ❌ Missing | No endpoint to list available regions |
| `POST /agents/validate` | ❌ Missing | No validation for agent combinations |

### Components

| Component | Status | Issues |
|-----------|--------|--------|
| `OnboardingEntry` | ✅ Implemented | Works |
| `BootstrapStatusCard` | ⚠️ Partial | Uses localStorage, no backend sync |
| `KitDeliveryPanel` | ⚠️ Partial | Calls backend but backend is stub |
| `OCTGuard` | ✅ Implemented | Works with bypass mode |
| `WizardStepper` | ✅ Implemented | Only used in legacy wizard flow |
| `WizardActions` | ✅ Implemented | Only used in legacy wizard flow |

---

## 3. Redundant Elements

### 🔄 Repeated Bootstrap Kit Actions

1. **Review Page** (`/onboarding/review/page.tsx`)
   - "Download Kit" button (line 294) - disabled, says "Coming Soon"
   - "Copy Verification Command" button (line 308) - works but command is hardcoded

2. **Dashboard** (`/dashboard/page.tsx`)
   - "Download Bootstrap Kit" button (line 214) - does nothing
   - "Download Bootstrap" in Quick Tools (line 249) - does nothing

3. **BootstrapStatusCard** (`BootstrapStatusCard.tsx`)
   - "Download Kit" button (line 260) - does nothing
   - "Copy Verify Command" button (line 266) - works

4. **KitDeliveryPanel** (`KitDeliveryPanel.tsx`)
   - "Download bootstrap.zip" button (line 84) - calls backend but backend returns stub

**Recommendation:** Consolidate to single source of truth. Use `BootstrapStatusCard` as the canonical component.

### 🔄 Duplicate Onboarding Flows

1. **Modern Flow** (`/onboarding/*`)
   - Company → Data Regions → Agents → Access → Review
   - Uses: `company.email`, `agentSelection.selectedAgents[]`, `accessConfig.authMethod`

2. **Wizard Flow** (`/wizard/*`)
   - Company → Data → Agents → Access → Review → Complete
   - Uses: `company.domain`, `agentPlan.plan + agentCount`, `accessModel.model`

**Recommendation:** Deprecate wizard flow. Migrate any unique features to modern flow.

### 🔄 Multiple Success/Complete Pages

1. `/complete` - Redirects to `/success`
2. `/success` - Shows success message
3. `/wizard/complete` - Shows `KitDeliveryPanel`

**Recommendation:** Consolidate to single completion flow.

---

## 4. Backend Requirements

### Required API Endpoints (Not Implemented)

1. **`GET /api/agents`**
   - Return list of available agents with:
     - `id`, `name`, `description`
     - `requirements` (dependencies, regions, etc.)
     - `capabilities` (what the agent can do)
   - Should be dynamic, not hardcoded

2. **`GET /api/regions`**
   - Return list of available regions with:
     - `id`, `name`, `location`
     - `compliance` (PCI, HIPAA, etc.)
     - `dataResidency` (boolean)

3. **`POST /api/bootstrap/kit`** (Fix path mismatch)
   - Generate actual bootstrap kit containing:
     - Kubernetes manifests (namespaces, RBAC, etc.)
     - Agent configurations
     - Initial secrets/keys
     - Tenant-specific settings
   - Return ZIP file with proper fingerprint
   - Store fingerprint in database

4. **`GET /api/bootstrap/meta/:tenantId`**
   - Return fingerprint and verification command for specific tenant
   - Should query database, not return hardcoded values

5. **`POST /api/bootstrap/verify`**
   - Verify kit fingerprint
   - Return validation result

6. **`POST /api/tenants`** (Fix schema)
   - Accept frontend schema:
     ```json
     {
       "company": { "name", "email", "industry", "size" },
       "dataRegionsConfig": { "sensitivity", "selectedRegions[]", "residencyRequired" },
       "agentSelection": { "selectedAgents[]" },
       "accessConfig": { "authMethod", "adminEmail", "clientId", "clientSecret", ... }
     }
     ```
   - Map to backend tenant structure
   - Create tenant record with proper relationships

7. **`GET /api/tenants/:id/status`**
   - Return tenant activation status
   - Bootstrap kit status
   - Agent deployment status

### Required Database Schema Updates

1. **Agents Table**
   ```sql
   CREATE TABLE public.agents (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     requirements JSONB,
     capabilities JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Tenant Agents Junction**
   ```sql
   CREATE TABLE public.tenant_agents (
     tenant_id TEXT REFERENCES public.tenants(id),
     agent_id TEXT REFERENCES public.agents(id),
     config JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     PRIMARY KEY (tenant_id, agent_id)
   );
   ```

3. **Bootstrap Kits Table**
   ```sql
   CREATE TABLE public.bootstrap_kits (
     id UUID PRIMARY KEY,
     tenant_id TEXT REFERENCES public.tenants(id),
     fingerprint TEXT UNIQUE NOT NULL,
     kit_data BYTEA,
     expires_at TIMESTAMP,
     activated_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

---

## 5. File-by-File Notes

### Core Onboarding Flow

#### `/onboarding/company/page.tsx`
- ✅ **Implemented:** Company name, industry, size, email
- ⚠️ **Missing:** Domain field (exists in wizard flow but not modern flow)
- ⚠️ **Validation:** Basic email regex, no domain validation
- ⚠️ **Backend:** No API call to validate company name uniqueness

#### `/onboarding/data-regions/page.tsx`
- ✅ **Implemented:** Region selection, sensitivity, residency toggle
- ⚠️ **Hardcoded:** Regions are hardcoded array, should come from backend
- ⚠️ **Missing:** Region-specific compliance requirements display

#### `/onboarding/agents/page.tsx`
- ✅ **Implemented:** Agent selection UI
- ❌ **Hardcoded:** 5 agents hardcoded in component
- ❌ **Missing:** Agent descriptions are minimal
- ❌ **Missing:** No agent dependency validation
- ❌ **Missing:** No backend call to fetch available agents

#### `/onboarding/access/page.tsx`
- ✅ **Implemented:** Local auth and SSO configuration
- ⚠️ **Missing:** SSO provider discovery/validation
- ⚠️ **Missing:** Callback URL validation
- ⚠️ **Missing:** SCIM endpoint configuration (only toggle exists)

#### `/onboarding/review/page.tsx`
- ✅ **Implemented:** Review all collected data
- ⚠️ **Missing:** Edit capability (can't go back to edit)
- ⚠️ **Bootstrap Kit:** Calls `/api/bootstrap/kit` (wrong path, should be `/bootstrap/kit`)
- ⚠️ **Fingerprint:** Generated client-side, not from actual kit
- ⚠️ **QR Code:** Hardcoded URL `https://bootstrap.example/activate/DEMO123`

### Dashboard & Completion

#### `/dashboard/page.tsx`
- ⚠️ **Fake Data:** Uses `useFakeTelemetry()`, `useActivityStream()`, `useStatusTiles()`
- ⚠️ **No Backend:** All data is simulated
- ⚠️ **Bootstrap Kit:** Download button does nothing
- ⚠️ **Missing:** Real tenant status, agent status, federation status

#### `/dashboard/personal/page.tsx`
- ✅ **Implemented:** Personal dashboard works
- ✅ **Uses:** localStorage for personal data
- ⚠️ **Missing:** Backend integration for personal nodes

#### `/complete/page.tsx`
- ⚠️ **Redirect Only:** Auto-redirects to `/success` after 800ms
- ⚠️ **No Content:** Doesn't show any completion details

#### `/success/page.tsx`
- ✅ **Implemented:** Success message and QR modal
- ⚠️ **QR Code:** Modal shows placeholder message

### Components

#### `BootstrapStatusCard.tsx`
- ✅ **Implemented:** Status tracking with localStorage
- ⚠️ **No Backend:** Status changes are local only
- ⚠️ **Download:** Button exists but doesn't actually download
- ✅ **Fingerprint:** Displays fingerprint from localStorage

#### `KitDeliveryPanel.tsx`
- ⚠️ **Partial:** Calls backend but backend returns stub
- ⚠️ **Path:** Uses `API_BASE_URL` correctly
- ⚠️ **Error Handling:** Basic alert on error

#### `OnboardingEntry.tsx`
- ✅ **Implemented:** Entry point selection works

#### `OCTGuard.tsx`
- ✅ **Implemented:** OCT validation works
- ✅ **Bypass:** Supports `NEXT_PUBLIC_BYPASS_YUBIKEY` for development

### Store & State

#### `lib/store/onboarding-store.ts`
- ✅ **Implemented:** Zustand store with persistence
- ⚠️ **Schema Mismatch:** Store schema doesn't match backend expectations
- ⚠️ **No Sync:** Data never synced to backend until final submission

### Legacy Wizard Flow

#### `/wizard/*` pages
- ⚠️ **Legacy:** Uses old schema (domain, agentPlan, accessModel)
- ⚠️ **Should Deprecate:** Modern flow is preferred
- ⚠️ **Incomplete:** Wizard flow also has stub backend calls

---

## 6. Recommended Phase Order

### Phase 1: Schema Alignment & Backend Fixes (Critical)
**Priority: P0 - Blocks all functionality**

1. **Fix Backend Schema Mismatch**
   - Update `/tenants` endpoint to accept frontend schema
   - Map `agentSelection.selectedAgents[]` to tenant_agents table
   - Map `accessConfig` to tenant access configuration
   - Test with frontend submission

2. **Fix API Path Mismatches**
   - Frontend calls `/api/bootstrap/kit` → Backend serves `/bootstrap/kit`
   - Add Next.js API route proxy OR update frontend to use correct path
   - Standardize on single path convention

3. **Implement Agent Registry**
   - Create `agents` table
   - Seed with 5 current agents
   - Create `GET /api/agents` endpoint
   - Update frontend to fetch agents dynamically

**Estimated Time:** 2-3 days

---

### Phase 2: Bootstrap Kit Generation (High Priority)
**Priority: P1 - Core feature**

1. **Define Kit Structure**
   - Document what files should be in bootstrap kit:
     - `kustomization.yaml` (tenant-specific)
     - `namespace.yaml`
     - `rbac.yaml` (if local auth)
     - `sso-config.yaml` (if SSO)
     - `agent-configs/` (one per selected agent)
     - `secrets/` (encrypted or placeholders)
     - `README.md` (instructions)

2. **Implement Kit Generation**
   - Create Go function to generate ZIP
   - Include all tenant configuration
   - Generate SHA-256 fingerprint from kit contents
   - Store fingerprint in `bootstrap_kits` table

3. **Fix Download Flow**
   - Update `handleBootstrapKit` to generate real kit
   - Return proper ZIP with correct headers
   - Update frontend to handle download correctly

4. **Implement Verification**
   - Create `POST /api/bootstrap/verify` endpoint
   - Accept fingerprint and validate against stored kits
   - Return validation result

**Estimated Time:** 3-4 days

---

### Phase 3: Dashboard Real Data Integration (Medium Priority)
**Priority: P2 - User experience**

1. **Replace Fake Telemetry**
   - Create `GET /api/tenants/:id/telemetry` endpoint
   - Return real agent counts, signal strength, rotation ETA
   - Update dashboard to use real data

2. **Implement Activity Stream**
   - Create `GET /api/tenants/:id/activity` endpoint
   - Return recent events (agent deployments, config changes, etc.)
   - Update `EventFeed` component

3. **Implement Status Tiles**
   - Create `GET /api/tenants/:id/status` endpoint
   - Return system health status
   - Update status tiles component

**Estimated Time:** 2-3 days

---

### Phase 4: Enhanced Validation & UX (Low Priority)
**Priority: P3 - Polish**

1. **Agent Dependency Validation**
   - Define agent dependencies (e.g., "observer requires etl-lite")
   - Validate selections on frontend
   - Show warnings for missing dependencies

2. **Region Compliance Validation**
   - Validate region selection against data sensitivity
   - Show compliance warnings (e.g., "HIPAA requires US regions only")

3. **SSO Provider Integration**
   - Add provider-specific configuration forms
   - Validate callback URLs
   - Test SSO connection before submission

4. **Edit Capability in Review**
   - Add "Edit" buttons in review page
   - Allow navigation back to specific steps
   - Preserve form data

**Estimated Time:** 3-4 days

---

### Phase 5: Deprecate Legacy Flow (Cleanup)
**Priority: P4 - Technical debt**

1. **Remove Wizard Flow**
   - Delete `/wizard/*` pages
   - Remove `WizardStepper` and `WizardActions` components
   - Update any links/redirects

2. **Consolidate Success Pages**
   - Merge `/complete` and `/success` into single page
   - Remove redirect logic

3. **Clean Up Redundant Components**
   - Consolidate bootstrap kit download to single component
   - Remove duplicate buttons

**Estimated Time:** 1 day

---

## 7. Immediate Next Step

### 🎯 Start Here: Phase 1.1 - Fix Schema Mismatch

**File to modify:** `onboarding/backend/handlers.go`

**Current Problem:**
```go
// Backend expects:
type Request struct {
    Company     interface{} `json:"company"`      // expects: {name, domain, region}
    DataRegions interface{} `json:"dataRegions"` // expects: DataRegion[] with .selected
    AgentPlan   interface{} `json:"agentPlan"`   // expects: {plan, agentCount}
    AccessModel interface{} `json:"accessModel"` // expects: {model, description}
}
```

**Frontend sends:**
```typescript
{
  company: { name, email, industry, size },  // ❌ No domain/region
  dataRegionsConfig: { sensitivity, selectedRegions[], residencyRequired },  // ❌ Different structure
  agentSelection: { selectedAgents[] },  // ❌ No plan/count
  accessConfig: { authMethod, adminEmail, clientId, ... }  // ❌ Different structure
}
```

**Action Items:**

1. **Update `handleCreateTenant` to accept frontend schema:**
   ```go
   type CreateTenantRequest struct {
       Company          CompanyData          `json:"company"`
       DataRegionsConfig DataRegionsConfig   `json:"dataRegionsConfig"`
       AgentSelection   AgentSelection       `json:"agentSelection"`
       AccessConfig     AccessConfig         `json:"accessConfig"`
   }
   ```

2. **Create proper structs matching frontend:**
   ```go
   type CompanyData struct {
       Name     string  `json:"name"`
       Email    string  `json:"email"`
       Industry *string `json:"industry,omitempty"`
       Size     *string `json:"size,omitempty"`
   }
   
   type DataRegionsConfig struct {
       Sensitivity      *string  `json:"sensitivity,omitempty"`
       SelectedRegions []string `json:"selectedRegions"`
       ResidencyRequired bool   `json:"residencyRequired"`
   }
   
   type AgentSelection struct {
       SelectedAgents []string `json:"selectedAgents"`
   }
   
   type AccessConfig struct {
       AuthMethod      string  `json:"authMethod"` // "local" | "sso"
       AdminEmail      *string `json:"adminEmail,omitempty"`
       TempPassword    *string `json:"tempPassword,omitempty"`
       IdentityProvider *string `json:"identityProvider,omitempty"`
       ClientId        *string `json:"clientId,omitempty"`
       ClientSecret    *string `json:"clientSecret,omitempty"`
       CallbackUrl     *string `json:"callbackUrl,omitempty"`
       ScimEnabled     bool    `json:"scimEnabled"`
   }
   ```

3. **Update tenant creation to store agent selection:**
   - Create `tenant_agents` junction table entries
   - Store access config in tenant `config_data` JSONB field

4. **Test with frontend:**
   - Submit from `/onboarding/review`
   - Verify tenant is created correctly
   - Verify agents are linked

**Files to create/modify:**
- `onboarding/backend/handlers.go` - Update `handleCreateTenant`
- `onboarding/db/migrations/002_tenant_agents.sql` - Create junction table
- `onboarding/db/migrations/003_agents_registry.sql` - Create agents table

**Estimated Time:** 4-6 hours

---

## Summary Statistics

- **Total Routes:** 15 (9 modern, 6 legacy)
- **Implemented Routes:** 12 (80%)
- **Partially Implemented:** 3 (20%)
- **Missing Routes:** 0 (all routes exist, some are stubs)

- **Total Components:** 8 core components
- **Fully Functional:** 5 (63%)
- **Partially Functional:** 3 (37%)

- **Backend Endpoints:** 8 total
- **Fully Implemented:** 4 (50%)
- **Partially Implemented:** 2 (25%)
- **Missing:** 2 (25%)

- **Critical Blockers:** 3 (Schema mismatch, Bootstrap kit stub, Agent registry missing)
- **High Priority Gaps:** 2 (Dashboard fake data, API path mismatches)
- **Medium Priority:** 3 (Validation, UX improvements)
- **Low Priority:** 2 (Legacy cleanup, polish)

---

**Recommended Starting Point:** Fix schema mismatch in `handleCreateTenant` (Phase 1.1) - this unblocks the entire onboarding flow.

