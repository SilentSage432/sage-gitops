# SAGE API Surface Inventory

This document catalogs all HTTP API endpoints currently exposed by SAGE services in the sage-gitops repository.

**Last Updated:** 2026-01-24  
**Scope:** Read-only discovery of existing endpoints. No modifications, no inference, no speculation.

---

## 1. Onboarding Backend Service (Go)

**Service:** `onboarding/backend`  
**File:** `onboarding/backend/router.go`  
**Namespace:** Unclear (not specified in router.go, likely deployed separately)  
**Port:** 8081 (default, configurable via PORT env var)  
**Deployment Status:** Yes (service exists, main.go serves on port 8081)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |
| `/api/federation/auth/handshake` | POST | Federation authentication handshake | control |
| `/api/federation/auth/assert` | POST | Federation authentication assertion | control |
| `/api/federation/auth/verify` | POST | Federation authentication verification | control |
| `/api/federation/auth/node/join` | POST | Node join endpoint for Pi bootstrap | control |
| `/api/federation/auth/export` | GET | Export federation authentication data | read-only |
| `/api/federation/auth/import` | POST | Import federation authentication data | control |
| `/federation/nodes` | GET | List registered federation nodes | read-only |
| `/federation/nodes/status` | GET | Get federation nodes status | read-only |
| `/federation/events` | GET | Get federation event stream | read-only |
| `/api/federation/agents/telemetry` | POST | Agent telemetry endpoint (requires agent federation auth) | control |
| `/api/federation/agents/commands` | POST | Agent command endpoint (requires agent federation auth) | control |
| `/api/federation/agents/jobs` | POST | Agent job endpoint (requires agent federation auth) | control |
| `/api/federation/agents/status` | GET | Agent status endpoint (requires agent federation auth) | read-only |
| `/federation/bus` | POST | Secure messaging endpoint for federation backplane (requires agent federation auth) | control |
| `/federation/api/onboarding/tenants` | POST | Create tenant (requires federation middleware) | control |
| `/federation/api/onboarding/bootstrap/kit` | POST | Bootstrap kit (requires federation middleware) | control |
| `/federation/api/onboarding/bootstrap/meta/{tenantId}` | GET | Get bootstrap metadata (requires federation middleware) | read-only |
| `/federation/api/onboarding/bootstrap/status/{tenantId}` | GET | Get bootstrap status (requires federation middleware) | read-only |
| `/federation/api/onboarding/bootstrap/verify` | POST, GET | Bootstrap verification (requires federation middleware) | mixed |
| `/federation/api/onboarding/bootstrap/scan` | GET | Bootstrap scan (requires federation middleware) | read-only |
| `/federation/api/onboarding/agents` | GET | List agents (requires federation middleware) | read-only |
| `/federation/api/onboarding/regions` | GET | List regions (requires federation middleware) | read-only |
| `/federation/api/onboarding/identity/providers` | GET | List identity providers (requires federation middleware) | read-only |
| `/federation/api/onboarding/identity/validate` | POST | Validate identity (requires federation middleware) | control |
| `/federation/api/onboarding/tenants/{tenantId}/telemetry` | GET | Get tenant telemetry (requires federation middleware) | read-only |
| `/federation/api/onboarding/tenants/{tenantId}/status` | GET | Get tenant status (requires federation middleware) | read-only |
| `/federation/api/onboarding/tenants/{tenantId}/activity` | GET | Get tenant activity (requires federation middleware) | read-only |
| `/federation/api/onboarding/tenants/{tenantId}/agents` | GET | Get tenant agents (requires federation middleware) | read-only |
| `/federation/api/onboarding/bootstrap/audit/{tenantId}` | GET | Get bootstrap audit log (requires federation middleware) | read-only |
| `/v1/init/webauthn/challenge` | POST | WebAuthn challenge (legacy) | control |
| `/v1/init/webauthn/verify` | POST | WebAuthn verification (legacy) | control |
| `/rho2/auth/issue` | POST | Issue OCT token | control |
| `/rho2/auth/verify` | POST | Verify OCT token | control |
| `/api/onboarding/tenants` | POST | Create tenant (backward compatibility) | control |
| `/api/onboarding/bootstrap/kit` | POST | Bootstrap kit (backward compatibility) | control |
| `/api/onboarding/bootstrap/meta/{tenantId}` | GET | Get bootstrap metadata (backward compatibility) | read-only |
| `/api/onboarding/bootstrap/status/{tenantId}` | GET | Get bootstrap status (backward compatibility) | read-only |
| `/api/onboarding/bootstrap/verify` | POST, GET | Bootstrap verification (backward compatibility) | mixed |
| `/api/onboarding/bootstrap/scan` | GET | Bootstrap scan (backward compatibility) | read-only |
| `/api/onboarding/agents` | GET | List agents (backward compatibility) | read-only |
| `/api/onboarding/regions` | GET | List regions (backward compatibility) | read-only |
| `/api/onboarding/identity/providers` | GET | List identity providers (backward compatibility) | read-only |
| `/api/onboarding/identity/validate` | POST | Validate identity (backward compatibility) | control |
| `/api/onboarding/tenants/{tenantId}/telemetry` | GET | Get tenant telemetry (backward compatibility) | read-only |
| `/api/onboarding/tenants/{tenantId}/status` | GET | Get tenant status (backward compatibility) | read-only |
| `/api/onboarding/tenants/{tenantId}/activity` | GET | Get tenant activity (backward compatibility) | read-only |
| `/api/onboarding/tenants/{tenantId}/agents` | GET | Get tenant agents (backward compatibility) | read-only |
| `/api/onboarding/bootstrap/audit/{tenantId}` | GET | Get bootstrap audit log (backward compatibility) | read-only |
| `/tenants` | POST | Create tenant (legacy backward compatibility) | control |
| `/bootstrap/kit` | POST | Bootstrap kit (legacy backward compatibility) | control |
| `/bootstrap/meta` | GET | Get bootstrap metadata (legacy backward compatibility) | read-only |
| `/api/intent/pending` | GET | Get pending intent approvals (read-only, no execution) | read-only |
| `/api/auth/status` | GET | Get authentication status | read-only |
| `/api/auth/register/begin` | POST | Begin WebAuthn registration | control |
| `/api/auth/register/finish` | POST | Finish WebAuthn registration | control |
| `/api/auth/verify/begin` | POST | Begin WebAuthn verification | control |
| `/api/auth/verify/finish` | POST | Finish WebAuthn verification | control |
| `/api/auth/verify` | POST | WebAuthn verification (alias for verify/finish) | control |
| `/api/auth/access/issue` | POST | Issue access token | control |

---

## 2. Backend Federation API (JavaScript/Express)

**Service:** `backend`  
**File:** `backend/router.js`  
**Namespace:** Unclear (not deployed as Kubernetes service in this repo)  
**Port:** Unclear (router.js exports router only, no server definition found)  
**Deployment Status:** Unclear (router exists but no server startup code found in this repo)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/federation/action/validate` | POST | Passive validation endpoint - no execution performed | read-only |
| `/federation/action/route` | POST | Returns routing information - no dispatch or execution | read-only |
| `/federation/action/approve` | POST | Passive operator consent - no execution performed | control |
| `/federation/action/reject` | POST | Passive operator rejection - no execution performed | control |
| `/federation/action/dispatch` | POST | Returns dispatch envelope - no actual dispatch or execution | read-only |
| `/federation/action/dispatch/simulate` | POST | Simulates dispatch - logs envelope but no real delivery | read-only |
| `/federation/state` | GET | Exposes virtual bus log and system state | read-only |
| `/federation/action/dry-run` | POST | Simulates execution - no real execution or side effects | read-only |
| `/federation/action/eligible` | POST | Returns agents capable of handling an action type | read-only |
| `/federation/action/evaluate` | POST | Unified rule evaluation across all dimensions (read-only) | read-only |
| `/federation/action/enforce/simulate` | POST | Simulates permission/rejection logic without real enforcement | read-only |
| `/federation/action/channel/init` | POST | Creates execution channel structure with enforcement + envelope (disabled) | read-only |
| `/api/channel/dryrun` | POST | Simulates executor through full channel (execution still disabled) | read-only |
| `/api/simulate` | POST | Returns orchestration simulation for UI display (read-only) | read-only |
| `/api/simulate/diff` | POST | Compares two simulation results and generates structured difference (read-only) | read-only |
| `/api/capabilities` | GET | Returns federation execution capability topology (read-only) | read-only |
| `/api/execution/candidates` | GET | Returns execution candidate chain for actions (read-only, no execution) | read-only |
| `/api/execution/risk` | GET | Returns risk profile, system impact, and expected reliability (read-only, no execution) | read-only |
| `/api/execution/forecast` | GET | Returns predicted future state after action execution (read-only, no execution) | read-only |
| `/api/execution/chain` | GET | Returns execution chain with ordering and responsibility mapping (read-only, no execution) | read-only |
| `/api/execution/gate` | GET | Returns execution gate status and clearance state (read-only, execution always disabled) | read-only |
| `/api/execution/gate/preview` | GET | Returns mode-aware execution gate preview (read-only, no state changes, no execution) | read-only |
| `/api/execution/envelope` | POST | Creates execution envelope (no execution performed) | read-only |
| `/api/execution/envelope/check` | POST | Validates envelope against gate (no execution) | read-only |
| `/api/execution/route` | POST | Purely read-only routing (no action, no mutation, no state change) | read-only |
| `/api/execution/simulate` | POST | Complete authorization simulation (no execution, no blocking, no state changes) | read-only |
| `/api/execution/ledger` | GET | Returns all execution attempts recorded in the ledger (passive, read-only) | read-only |
| `/api/operator/register-hardware` | POST | Registers hardware key (passive, non-auth) | control |
| `/api/operator/hardware` | GET | Gets hardware key information | read-only |
| `/api/operator/verify-hardware` | POST | Verifies hardware identity (passive - no enforcement) | read-only |
| `/api/operator/hardware/challenge` | GET | Generates WebAuthn challenge | read-only |
| `/api/operator/hardware/validate` | POST | Validates WebAuthn challenge response | read-only |

---

## 3. Arc Bridge Local (TypeScript/Express)

**Service:** `arc-bridge-local`  
**File:** `arc-bridge-local/src/server.ts`  
**Namespace:** Not deployed in Kubernetes (local development service)  
**Port:** 7070  
**Deployment Status:** No (local development only, not deployed to cluster)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/api/health` | GET | Health check endpoint | read-only |
| `/api/whisperer/message` | POST | Send whisperer message | control |
| `/api/whisperer/send` | POST | Send whisperer message (alternative endpoint) | control |
| `/api/rho2/status` | GET | Get Rho2 status | read-only |
| `/federation/nodes` | GET | List federation nodes | read-only |
| `/federation/nodes/status` | GET | Get federation nodes status | read-only |
| `/federation/events` | GET | Get federation events (supports filtering via query params) | read-only |
| `/federation/bus` | POST | Secure messaging endpoint for federation backplane | control |
| `/federation/commands` | GET | Query current command queue | read-only |
| `/federation/state` | GET | Read-only access to federation state: events, commands, subscriptions, intents, divergence, lifecycle, stale, topology, reasons, operator, actionTypes, actionLog | read-only |
| `/federation/operator/register` | POST | Register operator identity (passive, non-authenticated) | control |
| `/federation/operator/credential` | POST | Store operator credential (passive, non-verified) | control |
| `/federation/operator/challenge` | GET | Generate WebAuthn challenge | read-only |
| `/federation/operator/challenge/current` | GET | Read current challenge | read-only |
| `/federation/operator/assertion` | POST | Store WebAuthn assertion (passive, non-verified) | control |
| `/federation/operator/verify` | POST | Verify WebAuthn assertions (passive, no authentication granted) | read-only |
| `/federation/action/record` | POST | Record an action in audit trail without executing it | control |
| `/federation/action/preview` | POST | Preview the result of an action without executing it | read-only |
| `/api/intent` | POST | Analyze intent from text | read-only |
| `/api/act` | POST | Route action based on intent | control |

**Note:** WebSocket endpoint `/stream` exists but is not HTTP API.

---

## 4. SAGE API Service (Python/http.server)

**Service:** `sage-api`  
**File:** `kubernetes/arc-ui/sage-api-simple.yaml`  
**Namespace:** `arc-ui`  
**Port:** 3000  
**Deployment Status:** Yes (Kubernetes Deployment and Service defined)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/api/sage/reconciliation` | GET | Get GitOps reconciliation status | read-only |
| `/api/sage/signals` | GET | Get SAGE platform signals (platform, gitops, reconciliation) | read-only |
| `/api/status` | GET | Service status check | read-only |
| `/api/whisperer` | GET | Whisperer endpoint readiness check | read-only |
| `/api/auth/status` | GET | Authentication status check | read-only |

---

## 5. Arc Xi API (FastAPI)

**Service:** `xi-api`  
**File:** `arcs/xi/app/main.py`  
**Namespace:** `arc-xi`  
**Port:** 8000  
**Deployment Status:** Yes (Kubernetes Deployment defined in `arcs/xi/xi-api.yaml`)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |

**Note:** File contains commented future endpoints (not implemented):
- `/signals/emit` (stub)
- `/signals/listen` (stub)
- `/signals/state` (stub)
- `/metrics` (stub)
- `/events` (stub)

---

## 6. Arc Mu API (FastAPI)

**Service:** `mu-api`  
**File:** `arcs/mu/app/main.py`  
**Namespace:** `arc-mu`  
**Port:** 8000  
**Deployment Status:** Yes (Kubernetes Deployment defined in `arcs/mu/mu-api.yaml`)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |
| `/emit` | POST | Emit signal to relay (fans out to Lambda) | control |

---

## 7. Arc Nu API (FastAPI)

**Service:** `nu-api`  
**File:** `arcs/nu/app/main.py`  
**Namespace:** `arc-nu`  
**Port:** 8000  
**Deployment Status:** Yes (Kubernetes Deployment defined in `arcs/nu/nu-api.yaml`)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |
| `/ingest` | POST | Ingest data and fanout to Lambda and Mu | control |

---

## 8. Lambda API (FastAPI)

**Service:** `lambda-api`  
**File:** `lambda-api/app/main.py`  
**Namespace:** `arc-lambda`  
**Port:** 8000  
**Deployment Status:** Yes (Kubernetes Deployment defined in `arcs/lambda/lambda-api.yaml`)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |
| `/registry/status` | GET | Get registry connection status | read-only |
| `/federation/issue` | POST | Issue a multi-signature federation token | control |

---

## 9. Phi Cortex Service (aiohttp)

**Service:** `phi-cortex`  
**File:** `services/phi-cortex/main.py`  
**Namespace:** Unclear  
**Port:** 8091  
**Deployment Status:** Unclear (service code exists, Kubernetes manifests not found in this repo)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |

**Note:** Service primarily operates via NATS subscriptions, not HTTP API.

---

## 10. Arc Omicron API (FastAPI)

**Service:** `omicron-api`  
**File:** `arcs/omicron/app/main.py`  
**Namespace:** `arc-omicron`  
**Port:** 8000 (container), 80 (service)  
**Deployment Status:** Yes (Kubernetes Deployment defined in `arcs/omicron/omicron-api.yaml`)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint (returns ok or degraded based on DB readiness) | read-only |
| `/archive/write` | POST | Write event to archive database | control |
| `/archive/query` | GET | Query archived events (supports since, until, arc, source, limit query params) | read-only |

---

## 11. Xenolith Ledger Service (aiohttp)

**Service:** `xenolith-ledger`  
**File:** `services/xenolith-ledger/main.py`  
**Namespace:** Unclear  
**Port:** 8090  
**Deployment Status:** Unclear (service code exists, Kubernetes manifests not found in this repo)

### Endpoints

| Path | Method | Purpose | Data Direction |
|------|--------|---------|---------------|
| `/health` | GET | Health check endpoint | read-only |
| `/tail` | GET | Tail reason log (query param: lines, default 50) | read-only |

**Note:** Service primarily operates via NATS subscriptions, not HTTP API.

---

## Summary Statistics

- **Total Services Documented:** 11
- **Total Endpoints Documented:** ~120+
- **Services with Confirmed Kubernetes Deployment:** 6 (sage-api, xi-api, mu-api, nu-api, lambda-api, omicron-api)
- **Services with Unclear Deployment Status:** 5 (onboarding-backend, backend-federation, arc-bridge-local, phi-cortex, xenolith-ledger)
- **Read-Only Endpoints:** ~70+
- **Control/Mixed Endpoints:** ~50+

---

## Notes

1. **Deployment Status:** Several services (Xi, Mu, Nu, Lambda) have confirmed Kubernetes deployments via manifests in this repository. Other services (onboarding-backend, backend-federation, phi-cortex, xenolith-ledger) have code but deployment status is unclear.

2. **Backend Router:** The `backend/router.js` file exports a router but no server startup code was found in this repository. It may be consumed by another service or deployed separately.

3. **Arc Services:** Arc services (Xi, Mu, Nu, Lambda) have FastAPI applications with Kubernetes manifests in this repository. They are deployed to their respective arc namespaces.

4. **Local Development:** `arc-bridge-local` is explicitly a local development service and is not deployed to Kubernetes.

5. **Stub Endpoints:** Some services contain commented or stubbed endpoints that are not implemented. These are noted where found.

6. **WebSocket Endpoints:** WebSocket endpoints (e.g., `/stream` in arc-bridge-local) are not included in this inventory as they are not HTTP REST APIs.

7. **Authentication:** Many endpoints require authentication middleware (federation session, agent federation, etc.) but the actual enforcement status is unclear from code inspection alone.
