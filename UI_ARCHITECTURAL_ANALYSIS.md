# UI Architectural Analysis: sage-gitops → sage-onboarding-ui Integration Assessment

**Date:** 2025-01-27  
**Analyst:** Senior Systems Architect  
**Scope:** Comprehensive READ-ONLY analysis of UI surfaces in `sage-gitops` for potential integration into `sage-onboarding-ui`

---

## Executive Summary

The `sage-gitops/ui` repository contains a **sophisticated, federation-aware operator console** with:
- **27+ distinct UI surfaces** (panels, views, terminals)
- **Minimal authentication** (trusted operator model, no WebAuthn)
- **Extensive real-time capabilities** (WebSockets, SSE, polling)
- **Agent genesis workflows** (mutative operations)
- **Federation topology visualization** (read-only)
- **Legacy components** (deprecated but present)

**Critical Finding:** The UI assumes **unrestricted operator access** and contains **mutative operations** that would be **dangerous** without Architect-level authentication.

---

## STEP 1 — UI INVENTORY

### 1.1 Core Layout & Navigation

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **BridgeFrame** | `src/layout/BridgeFrame.tsx` | Main two-pane layout (terminal + panels) | Layout | No |
| **SidebarNavigator** | `src/components/SidebarNavigator/SidebarNavigator.tsx` | Navigation menu for all panels | Navigation | No |
| **OperatorInput** | `src/components/OperatorInput.tsx` | Command input bar (bottom dock) | Input | Yes (commands) |

### 1.2 Arc Panels (6 panels)

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **ArcThetaPanel** | `src/features/arc/ArcThetaPanel.tsx` | Theta Arc status display | Read-only | No |
| **ArcSigmaPanel** | `src/features/arc/ArcSigmaPanel.tsx` | Sigma Arc status display | Read-only | No |
| **ArcOmegaPanel** | `src/features/arc/ArcOmegaPanel.tsx` | Omega Arc status display | Read-only | No |
| **ArcRho2Lodge** | `src/features/arc/ArcRho2Lodge.tsx` | Rho² security chamber | Read-only | No |
| **ArcLambdaPanel** | `src/features/arc/ArcLambdaPanel.tsx` | Lambda Arc status display | Read-only | No |
| **ArcChiPanel** | `src/features/arc/ArcChiPanel.tsx` | Chi Arc status display | Read-only | No |

**Analysis:** All Arc panels are **read-only status displays**. They fetch from `/api/arc/{name}/status` but do not perform mutations.

### 1.3 Federation Panels (11 panels)

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **PiClusterChamber** | `src/features/federation/PiClusterChamber.tsx` | Pi cluster node grid & telemetry | Read-only | No |
| **OnboardingNexus** | `src/features/federation/OnboardingNexus.tsx` | Onboarding status display | Read-only | No |
| **NodesView** | `src/features/federation/NodesView.tsx` | Federation nodes list | Read-only | No |
| **FederationHealthMatrix** | `src/features/federation/FederationHealthMatrix.tsx` | Health dashboard (6 metrics) | Read-only | No |
| **FederationHealthCore** | `src/features/federation/FederationHealthCore.tsx` | Detailed health metrics | Read-only | No |
| **MeshTelemetrySurface** | `src/features/federation/MeshTelemetrySurface.tsx` | Real-time telemetry stream | Read-only | No |
| **SignalHistoryPanel** | `src/features/federation/SignalHistoryPanel.tsx` | Historical signal log | Read-only | No |
| **FederationAlertsPanel** | `src/features/federation/FederationAlertsPanel.tsx` | Alert stream display | Read-only | No |
| **FederationLogs** | `src/features/federation/FederationLogs.tsx` | Federation log viewer | Read-only | No |
| **NodeDetailsPanel** | `src/features/federation/NodeDetailsPanel.tsx` | Individual node deep-dive | Read-only | No |
| **TopologyPanel** | `src/features/federation/TopologyPanel.tsx` | Network topology graph | Read-only | No |
| **FederationStatePanel** | `src/features/federation/FederationStatePanel.tsx` | Federation state display | Read-only | No |

**Analysis:** All Federation panels are **read-only**. They consume WebSocket streams and API endpoints but do not mutate state.

### 1.4 Agents Panels (4 panels)

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **AgentsOverview** | `src/features/agents/AgentsOverview.tsx` | List of all agents | Read-only | No |
| **AgentDetails** | `src/features/agents/AgentDetails.tsx` | Individual agent details | Read-only | No |
| **AgentGenesis** | `src/features/agents/AgentGenesis.tsx` | **CREATE NEW AGENTS** | **Mutative** | **YES** |
| **AgentLibraryPanel** | `src/features/agents/AgentLibraryPanel.tsx` | Agent template library | Read-only | No |

**Analysis:** ⚠️ **AgentGenesis is DANGEROUS** — it creates new autonomous agents via `POST /api/agents/genesis`. This requires **Architect authority**.

### 1.5 Operator Terminal & Cognition

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **OperatorTerminal** | `src/components/OperatorTerminal.tsx` | Command terminal (left pane) | **Mutative** | **YES** |
| **CognitionPanel** | `src/features/cognition/CognitionPanel.tsx` | Thought stream display | Read-only | No |

**Analysis:** ⚠️ **OperatorTerminal is DANGEROUS** — it routes commands through `routeCommand()` which can dispatch `OPERATOR_COMMAND` events. Commands may trigger system actions.

### 1.6 Identity & Status Components

| Component | Path | Purpose | Type | Mutative? |
|-----------|------|---------|------|-----------|
| **OperatorIdentityLamp** | `src/components/OperatorIdentityLamp.tsx` | Operator identity status display | Read-only | No |
| **HardwareKeyVerification** | `src/components/HardwareKeyVerification.tsx` | Hardware key verification UI | **Mutative** | **YES** |

**Analysis:** ⚠️ **HardwareKeyVerification performs POST** to `/api/federation/verify-hardware-key`. This is a **security-sensitive operation**.

### 1.7 Legacy Components (Deprecated)

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| **Legacy App** | `src/legacy/App.tsx.old` | Old routing structure | Deprecated |
| **Legacy Pages** | `src/legacy/pages/` | GodView, Vitals, Home pages | Deprecated |
| **Legacy Shells** | `src/legacy/shells/` | Old shell components | Deprecated |

**Analysis:** Legacy components are **not actively used** but remain in codebase. Should be **archived or removed** before integration.

---

## STEP 2 — AUTHORITY ASSUMPTION ANALYSIS

### 2.1 Authentication Model

**Current State:**
- `AuthContext.tsx` assumes **always authenticated** (`isAuthenticated: true` by default)
- No WebAuthn integration
- No session management
- No token validation
- User is hardcoded as `{ name: 'Operator', role: 'root' }`

**Authority Assumed:** **Unrestricted root access**

### 2.2 Authority Risk Matrix

| UI Surface | Assumed Authority | Risk Level | Exposes Sensitive Data? | Requires Backend Trust? |
|------------|-------------------|------------|-------------------------|-------------------------|
| **AgentGenesis** | Root | 🔴 **CRITICAL** | Yes (agent manifests) | Yes (agent creation) |
| **OperatorTerminal** | Root | 🔴 **CRITICAL** | Yes (command history) | Yes (command execution) |
| **HardwareKeyVerification** | Root | 🟠 **HIGH** | Yes (hardware keys) | Yes (verification) |
| **Federation Panels** | Root | 🟡 **MEDIUM** | Yes (topology, nodes) | No (read-only) |
| **Arc Panels** | Root | 🟡 **MEDIUM** | Yes (arc status) | No (read-only) |
| **CognitionPanel** | Root | 🟡 **MEDIUM** | Yes (thought stream) | No (read-only) |
| **AgentsOverview** | Root | 🟡 **MEDIUM** | Yes (agent list) | No (read-only) |

### 2.3 Dangerous Operations Without Architect Auth

1. **Agent Genesis** (`AgentGenesis.tsx`)
   - Creates new autonomous agents
   - Submits manifests to `/api/agents/genesis`
   - Can deploy agents to federation
   - **MUST BE ARCHITECT-ONLY**

2. **Operator Terminal Commands** (`OperatorTerminal.tsx`)
   - Routes commands via `routeCommand()`
   - Dispatches `OPERATOR_COMMAND` events
   - May trigger system mutations
   - **MUST BE ARCHITECT-ONLY** (or restricted command set for Operators)

3. **Hardware Key Verification** (`HardwareKeyVerification.tsx`)
   - Verifies hardware keys via POST
   - Security-sensitive operation
   - **MUST BE ARCHITECT-ONLY**

---

## STEP 3 — STATE & DEPENDENCY ANALYSIS

### 3.1 State Management

**Local React State:**
- Most panels use `useState` for local UI state
- No global state management (Redux/Zustand) except:
  - `OperatorMemoryContext` (in-memory command history)
  - `RBACContext` (empty by default)

**Backend Dependencies:**
- **HTTP APIs:** `/api/godview/*`, `/api/lifecycle/*`, `/api/agents/*`, `/api/federation/*`
- **WebSockets:** Multiple endpoints:
  - `ws://.../federation/nodes`
  - `ws://.../federation/genesis`
  - `ws://.../nodes/{id}/stream`
  - `ws://.../nodes/{id}/events`
  - `ws://.../nodes/{id}/thermal`
  - `ws://.../mesh/telemetry`
- **SSE:** `/api/stream` (topology, pods, deployments)

### 3.2 Session Awareness

**Current State:**
- ❌ **No session management**
- ❌ **No token refresh**
- ❌ **No logout flow**
- ✅ **Persists command log to localStorage** (OperatorTerminal)

**Assumptions:**
- System is **always running**
- Backend is **always available**
- WebSocket connections **auto-reconnect**
- Falls back to **mock data** if backend unavailable

### 3.3 Long-Running Connections

| Connection Type | Component | Reconnect? | Fallback? |
|-----------------|-----------|-------------|-----------|
| WebSocket (nodes) | `useFederationNodes` | Yes | Mock data |
| WebSocket (genesis) | `genesisClient` | Yes | None |
| WebSocket (telemetry) | `useMeshTelemetry` | Yes | Mock data |
| SSE (topology) | `godviewStream` | Yes | None |
| Polling (arc status) | Arc panels | No | Loading state |

**Analysis:** UI is **resilient to backend failures** but assumes **eventual connectivity**.

---

## STEP 4 — INTEGRATION CLASSIFICATION

### Classification Key:
- **A)** Panel Assimilation → Panel inside existing console layout
- **B)** Routed Console Module → `/console/<module>` under existing shell
- **C)** Embedded / Sandboxed → iframe'd or isolated (read-only/experimental)
- **D)** Deferred / Archive → NOT integrated at this time

### 4.1 Arc Panels → **Classification: A (Panel Assimilation)**

**Reasoning:**
- Read-only status displays
- Natural fit for console panels
- No mutative operations
- Low risk

**Recommendation:** Integrate as panels in existing console layout.

### 4.2 Federation Panels → **Classification: B (Routed Console Module)**

**Reasoning:**
- Comprehensive federation management interface
- Natural grouping under `/console/federation`
- Read-only (safe for Operator view with reduced data)
- High value for system monitoring

**Recommendation:** Create `/console/federation` route with sub-routes:
- `/console/federation/health`
- `/console/federation/nodes`
- `/console/federation/telemetry`
- `/console/federation/topology`

### 4.3 Agents Panels → **Classification: C (Embedded/Sandboxed) + D (Deferred)**

**Reasoning:**
- **AgentGenesis** is mutative and dangerous → **D (Deferred)**
- **AgentsOverview/Details** are read-only → **C (Sandboxed iframe)**
- Requires Architect authentication before integration

**Recommendation:**
- **AgentGenesis:** DO NOT INTEGRATE until Architect auth is in place
- **AgentsOverview/Details:** Embed as read-only iframe (Architect-only)

### 4.4 Operator Terminal → **Classification: D (Deferred)**

**Reasoning:**
- Mutative command routing
- Assumes unrestricted access
- Conflicts with truthful UI philosophy (no session management)
- Requires complete rewrite for Architect/Operator separation

**Recommendation:** DO NOT INTEGRATE. Requires:
1. Command whitelist for Operators
2. Architect-only commands
3. Session-aware command history
4. Integration with sage-onboarding-ui's terminal system

### 4.5 Cognition Panel → **Classification: C (Embedded/Sandboxed)**

**Reasoning:**
- Read-only thought stream
- Experimental/observational
- Low risk but may expose sensitive cognitive state

**Recommendation:** Embed as read-only iframe (Architect-only).

### 4.6 Identity Components → **Classification: B (Routed Console Module)**

**Reasoning:**
- **OperatorIdentityLamp:** Read-only status → Safe for Operator view
- **HardwareKeyVerification:** Mutative → Architect-only, deferred

**Recommendation:**
- **OperatorIdentityLamp:** Integrate into console header
- **HardwareKeyVerification:** Defer until Architect auth

---

## STEP 5 — AUTHORITY MAPPING

### 5.1 Required Authority Matrix

| UI Surface | Architect-Only | Operator-Safe | Read-Only Observer | Notes |
|------------|----------------|---------------|-------------------|--------|
| **AgentGenesis** | ✅ **REQUIRED** | ❌ | ❌ | Mutative, dangerous |
| **OperatorTerminal** | ✅ **REQUIRED** | ⚠️ (restricted) | ❌ | Needs command whitelist |
| **HardwareKeyVerification** | ✅ **REQUIRED** | ❌ | ❌ | Security-sensitive |
| **Federation Panels** | ❌ | ✅ (reduced data) | ✅ | Read-only, safe |
| **Arc Panels** | ❌ | ✅ | ✅ | Read-only, safe |
| **AgentsOverview** | ⚠️ (full data) | ⚠️ (limited) | ✅ | May expose agent details |
| **CognitionPanel** | ✅ **REQUIRED** | ❌ | ✅ | Exposes cognitive state |
| **OperatorIdentityLamp** | ❌ | ✅ | ✅ | Read-only status |

### 5.2 Visibility Rules

**Hidden Without Architect Auth:**
- AgentGenesis
- HardwareKeyVerification
- CognitionPanel
- Full OperatorTerminal (command routing)

**Visible But Locked (Operator View):**
- Federation Panels (reduced data)
- Arc Panels (status only)
- AgentsOverview (limited details)

**Visible With Reduced Data (Operator View):**
- NodeDetailsPanel (hide sensitive metrics)
- FederationHealthMatrix (hide critical alerts)
- MeshTelemetrySurface (hide node IDs)

---

## STEP 6 — RISK & CONFLICT ASSESSMENT

### 6.1 Duplicate Functionality

| sage-gitops UI | sage-onboarding-ui Equivalent | Conflict? |
|----------------|-------------------------------|-----------|
| **OperatorTerminal** | Console shell terminal | ⚠️ **YES** — Different command routing |
| **OnboardingNexus** | Onboarding flow | ⚠️ **YES** — May duplicate |
| **OperatorIdentityLamp** | Identity display | ⚠️ **YES** — Different auth model |

**Resolution:**
- **OperatorTerminal:** Use sage-onboarding-ui's terminal (more secure)
- **OnboardingNexus:** Verify if duplicate; if so, use sage-onboarding-ui version
- **OperatorIdentityLamp:** Integrate into sage-onboarding-ui's identity system

### 6.2 Conflicting Mental Models

| Conflict | sage-gitops Assumption | sage-onboarding-ui Reality | Impact |
|----------|----------------------|---------------------------|--------|
| **Always-On System** | Backend always available | Session-based UI | High — UI may break on session expiry |
| **Unrestricted Access** | Root operator by default | Architect vs Operator separation | Critical — Security risk |
| **No Session Management** | Persistent connections | WebAuthn session tokens | High — Auth mismatch |
| **Mock Data Fallback** | Graceful degradation | Truthful UI (no mocks) | Medium — Philosophy conflict |

**Resolution:**
- Remove mock data fallbacks
- Add session-aware connection management
- Implement Architect/Operator separation
- Add proper error states (no fake data)

### 6.3 Truthful UI Philosophy Violations

**Violations Found:**
1. **Mock Data Fallbacks** (`useFederationNodes`, `useMeshTelemetry`)
   - Generates fake data when backend unavailable
   - Violates "truthful UI" principle

2. **Hardcoded User** (`AuthContext.tsx`)
   - Always authenticated, no real auth
   - Violates security model

3. **Inferred Edges** (`godviewClient.ts`)
   - Generates fallback topology when lifecycle offline
   - Violates truthful display

**Resolution:**
- Remove all mock data generators
- Show "unavailable" states instead of fake data
- Require real authentication before UI access

---

## STEP 7 — FINAL REPORT

### 7.1 UI Inventory Summary

**Total UI Surfaces:** 27+  
**Read-Only:** 22  
**Mutative:** 5  
**Deprecated/Legacy:** 8+

### 7.2 Authority Risk Summary

| Risk Level | Count | Examples |
|------------|-------|----------|
| 🔴 **CRITICAL** | 3 | AgentGenesis, OperatorTerminal, HardwareKeyVerification |
| 🟠 **HIGH** | 0 | - |
| 🟡 **MEDIUM** | 8 | Federation panels, Arc panels, Cognition |
| 🟢 **LOW** | 16 | Read-only displays, status indicators |

### 7.3 Recommended Integration Targets

#### ✅ **SAFE TO INTEGRATE (Read-Only, Low Risk)**

1. **Arc Panels** (6 panels)
   - Classification: **A (Panel Assimilation)**
   - Authority: Operator-safe
   - Integration: Add to console panel system

2. **Federation Health Panels** (8 panels)
   - Classification: **B (Routed Console Module)**
   - Authority: Operator-safe (with reduced data)
   - Integration: Create `/console/federation/*` routes

3. **OperatorIdentityLamp** (read-only)
   - Classification: **B (Routed Console Module)**
   - Authority: Operator-safe
   - Integration: Add to console header

#### ⚠️ **CONDITIONAL INTEGRATION (Requires Architect Auth)**

1. **AgentsOverview/Details** (read-only)
   - Classification: **C (Embedded/Sandboxed)**
   - Authority: Architect-only (full data), Operator (limited)
   - Integration: iframe with Architect auth check

2. **CognitionPanel** (read-only)
   - Classification: **C (Embedded/Sandboxed)**
   - Authority: Architect-only
   - Integration: iframe, Architect-only

#### ❌ **DO NOT INTEGRATE YET**

1. **AgentGenesis**
   - Reason: Mutative, creates agents, requires Architect auth
   - Status: **DEFERRED** until Architect authentication is implemented

2. **OperatorTerminal**
   - Reason: Mutative commands, conflicts with sage-onboarding-ui terminal
   - Status: **DEFERRED** — use sage-onboarding-ui's terminal instead

3. **HardwareKeyVerification**
   - Reason: Security-sensitive POST operation
   - Status: **DEFERRED** until Architect auth

4. **Legacy Components**
   - Reason: Deprecated, not actively used
   - Status: **ARCHIVE** — remove before integration

### 7.4 Open Questions (Require Architect Decision)

1. **Command Terminal Strategy**
   - Should sage-gitops OperatorTerminal be merged with sage-onboarding-ui terminal?
   - Or should they remain separate with different command sets?
   - **Decision Required:** Terminal integration approach

2. **OnboardingNexus Duplication**
   - Does sage-onboarding-ui already have onboarding flow?
   - Is OnboardingNexus redundant?
   - **Decision Required:** Keep or remove OnboardingNexus

3. **Mock Data Philosophy**
   - Should mock data fallbacks be removed entirely?
   - Or kept for development/testing?
   - **Decision Required:** Mock data policy

4. **WebSocket Connection Strategy**
   - How should WebSocket connections handle session expiry?
   - Should connections be session-aware?
   - **Decision Required:** Connection lifecycle management

5. **Federation Token Integration**
   - sage-gitops uses `X-Federation-Token` header
   - How does this integrate with WebAuthn tokens?
   - **Decision Required:** Token strategy

6. **Operator vs Architect Command Sets**
   - Which commands should Operators have access to?
   - Which commands require Architect auth?
   - **Decision Required:** Command authorization matrix

---

## Conclusion

The `sage-gitops/ui` repository contains **valuable observational and monitoring interfaces** that can be safely integrated into `sage-onboarding-ui` **after** implementing Architect-level authentication and removing mutative operations from Operator-accessible surfaces.

**Immediate Actions:**
1. ✅ Integrate read-only Arc panels (6 panels)
2. ✅ Integrate Federation health panels (8 panels) with reduced data for Operators
3. ❌ **DO NOT** integrate AgentGenesis, OperatorTerminal, or HardwareKeyVerification until Architect auth is in place
4. 🗑️ Remove or archive legacy components
5. 🔒 Implement Architect/Operator separation before exposing mutative operations

**Integration Priority:**
1. **Phase 1:** Read-only panels (Arc, Federation health) — **LOW RISK**
2. **Phase 2:** Architect-only panels (Agents, Cognition) — **MEDIUM RISK**
3. **Phase 3:** Mutative operations (AgentGenesis, Terminal) — **HIGH RISK** (requires Architect auth)

---

**Analysis Complete.** ✅
