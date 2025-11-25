# PG-2 (Pi Genesis Wiring) - Complete File Map

## A) COMPLETE LIST OF RELEVANT FILES

### 1. TERMINAL COMMAND ROUTING

#### 1.1 Primary Command Entry Points
- **`ui/src/components/OperatorTerminal.tsx`**
  - **Purpose**: Main terminal component that displays command history and output
  - **Key Functions**:
    - `handleCommand(command: string)` - Processes user commands
    - `addLog()` - Adds entries to command log
    - Exposes `window.__federationCommandLog` hook for federation integration
    - Dispatches `OPERATOR_COMMAND` custom events
    - Persists command history to localStorage
  
- **`ui/src/components/OperatorInput.tsx`**
  - **Purpose**: Input component for operator commands
  - **Key Functions**:
    - `handleCommand(command: string)` - Sends commands via `window.__federationCommandLog.handleCommand()` if available
    - Falls back to local `onSend` prop

#### 1.2 Command Routing Layer
- **`ui/src/features/operator/commandRouter.ts`**
  - **Purpose**: E3 interpretive command router (current implementation)
  - **Key Functions**:
    - `routeCommand(input: string): Promise<CommandResponse[]>` - Main routing function
    - `getAllCommands()` - Returns list of known commands
    - `suggestCommand(input: string)` - Provides command suggestions
    - **Known Commands**: `clear`, `help`, `pi status`, `pi list`, `pi restart`, `rho2 status`, `agents list`, `nodes list`
    - **Status**: Placeholder implementation - returns info messages for now

- **`ui/src/sage/commandRouter.ts`**
  - **Purpose**: Alternative/legacy command router (federation-ready)
  - **Key Functions**:
    - `routeCommand(input: string, emit: (r: CommandResponse) => void): Promise<void>`
    - Checks `commandRegistry` for command definitions
    - Has special handling for "telemetry" command (federation routing)
    - Emits CommandResponse objects with status updates

- **`ui/src/sage/commandRegistry.ts`**
  - **Purpose**: Command definitions registry
  - **Key Exports**:
    - `CommandDefinition` type: `{ name, description, category, execution, requiresAuthority? }`
    - `commandRegistry: CommandDefinition[]` - Array of registered commands
    - **Current Commands**: `status`, `telemetry`, `scan`
    - **Execution Types**: `"local" | "federated" | "hybrid"`

- **`ui/src/sage/commandResponse.ts`**
  - **Purpose**: Command response type definitions
  - **Key Exports**:
    - `CommandResponse` type: `{ command, status, message, timestamp }`
    - `createResponse()` - Factory function for creating responses
    - **Status Values**: `"received" | "processing" | "completed" | "failed"`

#### 1.3 Operator Cortex (Command Context)
- **`ui/src/core/OperatorCortex.ts`**
  - **Purpose**: Tracks operator engagement and context shifts
  - **Key Functions**:
    - `useOperatorCortex(selectedItem?: string)` - Hook for operator state
    - `registerCommand()` - Marks operator as active
    - `isOperatorActive()` - Checks if operator recently issued commands
    - Dispatches `cortex.operator-engaged` and `cortex.context-shift` UI actions

### 2. GENESIS ORCHESTRATOR LOGIC

#### 2.1 Agent Genesis Panel (UI)
- **`ui/src/features/agents/AgentGenesis.tsx`**
  - **Purpose**: UI panel for designing and forging agents
  - **Key State**:
    - `agentName` - Agent name input
    - `agentClass` - Selected agent class (researcher, watcher, analyst, sentinel, auditor, custom)
    - `selectedCaps` - Array of selected capabilities
  - **Key Functions**:
    - `toggleCap(cap: string)` - Toggles capability selection
    - Constructs manifest object dynamically
    - **Forge Button**: Currently shows `alert()` - placeholder for real backend
    - **Status**: UI complete, backend integration needed

#### 2.2 Legacy Agent Genesis (Reference)
- **`ui/src/legacy/panels/panels/agent-genesis/GodViewTab.tsx`**
  - **Purpose**: Legacy mappings console for agent genesis
  - **Status**: Reference/documentation only, not actively used

#### 2.3 Missing Orchestrator Files (Should Exist)
- **`ui/src/features/agents/orchestrator/GenesisOrchestrator.ts`** ⚠️ **MISSING**
  - Should handle agent creation workflow
  - Should validate manifests
  - Should coordinate with backend API
  - Should manage genesis state machine

- **`ui/src/features/agents/orchestrator/agentManifestValidator.ts`** ⚠️ **MISSING**
  - Should validate agent manifest structure
  - Should check capability compatibility
  - Should validate agent class constraints

- **`ui/src/features/agents/orchestrator/genesisStateMachine.ts`** ⚠️ **MISSING**
  - Should manage genesis workflow states (draft → validating → forging → deployed)
  - Should handle state transitions
  - Should emit state change events

### 3. FEDERATION PANEL REGISTRY

#### 3.1 Main Panel Router (App.tsx)
- **`ui/src/app/App.tsx`**
  - **Purpose**: Root component with panel routing switch statement
  - **Key Functions**:
    - `renderActiveChamber()` - Switch statement mapping panel IDs to components
    - **Panel Registry**: Manual switch/case mapping
    - **Current Panels**:
      - Arcs: `arc-theta`, `arc-sigma`, `arc-omega`, `arc-rho2`, `arc-lambda`, `arc-chi`
      - Federation: `pi-kluster`, `onboarding-nexus`, `nodes`, `federation-health`, `mesh-telemetry`, `signal-history`, `federation-alerts`, `federation-logs`
      - Agents: `agents`, `agent-genesis` ✅
      - Other: `tools`, `operator-terminal`, `cognition`, `node:*` (dynamic)
    - **Selected Item State**: `selectedItem` string state controls active panel

#### 3.2 Sidebar Navigation
- **`ui/src/components/SidebarNavigator/SidebarNavigator.tsx`**
  - **Purpose**: Sidebar menu that triggers panel selection
  - **Key Functions**:
    - Menu items include `id`, `label`, `symbol` properties
    - **Agents Section**: Contains `agents` (Agents Overview) and `agent-genesis` (Agent Genesis ⚡)
    - Selecting item calls `onSelectItem(id)` which updates App.tsx state
    - Closes sidebar when item selected

#### 3.3 Bridge Frame (Layout)
- **`ui/src/layout/BridgeFrame.tsx`**
  - **Purpose**: Main layout component that renders panels
  - **Key Props**:
    - `selectedItem` - Current panel ID
    - `onSelectItem` - Callback to change panel
    - `activeChamber` - The rendered panel component
  - Renders SidebarNavigator and passes `activeChamber` to right panel area

#### 3.4 Legacy Panel Registry (Reference)
- **`ui/src/legacy/panels/panels/registry.ts`**
  - **Purpose**: Legacy console registry (not actively used for panels)
  - **Exports**: `CONSOLES` array with console definitions
  - **Status**: Reference only, newer panels use App.tsx switch statement

### 4. BACKEND API FOR AGENT CREATION

#### 4.1 Frontend API Clients
- **`ui/src/services/whispererService.ts`**
  - **Purpose**: Service for Whisperer API interactions
  - **Key Functions**:
    - `listAgents(): Promise<AgentStatus[]>` - Lists agents
    - `handleCommand(input: string): Promise<string>` - Processes commands (includes `/agents`)
    - Uses `apiFetch()` utility for HTTP requests
    - **Status**: Has mock data for local dev, no agent creation endpoint yet

- **`ui/src/services/federationService.ts`**
  - **Purpose**: Federation node and tenant management
  - **Key Functions**:
    - `getFederationNodes(): Promise<FederationNode[]>`
    - `getTenants(): Promise<Tenant[]>`
  - **Status**: Mock data only, no agent creation

- **`ui/src/services/lifecycleService.ts`**
  - **Purpose**: Kubernetes lifecycle management (pods, deployments)
  - **Key Functions**:
    - `getPods(ns): Promise<PodRow[]>`
    - `getDeploys(ns): Promise<DeployRow[]>`
    - `getPodDetails(ns, name)`
  - **Status**: Could be extended for agent deployment, currently only reads K8s state

#### 4.2 API Base Shim
- **`ui/src/apiBaseShim.ts`**
  - **Purpose**: API base URL configuration
  - **Status**: Defines base URL for API calls

#### 4.3 Missing API Client Files (Should Exist)
- **`ui/src/services/agentService.ts`** ⚠️ **MISSING**
  - Should provide: `createAgent(manifest)`, `forgeAgent(id)`, `getAgentStatus(id)`, `listAgents()`
  - Should handle API communication with backend genesis orchestrator

- **`ui/src/api/genesisClient.ts`** ⚠️ **MISSING**
  - Should handle WebSocket connection for genesis events
  - Should handle HTTP API calls for agent creation
  - Should handle manifest validation API calls

#### 4.4 Backend API Endpoints (Backend Files - Reference)
- **`arcs/lambda/app/main.py`** (Backend)
  - Has `/federation/issue` endpoint for federation tokens
  - Has `/registry/status` endpoint
  - **Status**: Could be extended for agent genesis API

- **`lambda-api/app/main.py`** (Backend)
  - Has registry client for service registration
  - **Status**: Could be extended for agent lifecycle management

- **`kubernetes/arc-ui/sage-api.yaml`** (Backend Config)
  - Defines nginx config for `/api/status`, `/api/whisperer`
  - **Status**: No agent genesis endpoints yet

### 5. ADDITIONAL RELEVANT FILES

#### 5.1 Federation WebSocket (Genesis Events)
- **`ui/src/sage/federation/useFederationWS.ts`**
  - **Purpose**: WebSocket hook for federation genesis stream
  - **Key Functions**:
    - `useFederationGenesisStream()` - Listens for `federation.node.genesis` events
    - Connects to `ws://localhost:7001/federation/genesis` (or env config)
    - Returns genesis event data: `{ nodeId, hardware, fingerprint }`
  - **Status**: Already wired, listens for node genesis events

#### 5.2 Agent Overview Panel
- **`ui/src/features/agents/AgentsOverview.tsx`**
  - **Purpose**: Lists all agents in federation
  - **Status**: UI exists, may need integration with agent creation

- **`ui/src/features/agents/AgentDetails.tsx`**
  - **Purpose**: Shows details for a specific agent
  - **Status**: UI exists for viewing agent details

#### 5.3 UI Action Bus (Event System)
- **`ui/src/core/UIActionBus.ts`**
  - **Purpose**: Event bus for UI actions
  - **Key Functions**:
    - `dispatchUIAction(type: string, payload: any)`
    - Could be used for genesis workflow events

#### 5.4 Whisperer Terminal (Alternative Terminal)
- **`ui/src/components/WhispererTerminal/commandRouter.ts`**
  - **Purpose**: Alternative command router for Whisperer terminal
  - **Status**: May have different command handling

---

## B) FUNCTIONS/EXPORTS THAT PG-2 WILL LIKELY TOUCH

### Terminal Command Routing
1. **`ui/src/features/operator/commandRouter.ts`**:
   - ✅ `routeCommand()` - Add `agent forge` or `agent create` command
   - ✅ `knownCommands[]` - Add genesis commands
   - ✅ `suggestCommand()` - Ensure genesis commands are recognized

2. **`ui/src/components/OperatorTerminal.tsx`**:
   - ✅ `handleCommand()` - Already dispatches `OPERATOR_COMMAND` events
   - ✅ `window.__federationCommandLog.handleCommand` - Federation hook (ready)

3. **`ui/src/core/OperatorCortex.ts`**:
   - ✅ `registerCommand()` - Will track genesis commands
   - ✅ `isOperatorActive()` - Will mark operator active during genesis

### Genesis Orchestrator
4. **`ui/src/features/agents/AgentGenesis.tsx`**:
   - ✅ `toggleCap()` - Already implemented
   - ⚠️ **FORGE BUTTON** - Currently `alert()` - **NEEDS**: Real `forgeAgent()` call
   - ⚠️ **MANIFEST** - Constructs manifest object - **NEEDS**: Validation before forging

5. **`ui/src/features/agents/orchestrator/GenesisOrchestrator.ts`** ⚠️ **TO CREATE**:
   - ⚠️ `orchestrateGenesis(manifest)` - Main orchestrator function
   - ⚠️ `validateManifest(manifest)` - Validation logic
   - ⚠️ `submitGenesisRequest(manifest)` - API submission
   - ⚠️ `trackGenesisStatus(id)` - Status tracking

### Panel Registry
6. **`ui/src/app/App.tsx`**:
   - ✅ `renderActiveChamber()` - Already has `case 'agent-genesis'` route
   - ✅ `selectedItem` state - Already wired

7. **`ui/src/components/SidebarNavigator/SidebarNavigator.tsx`**:
   - ✅ Menu item - Already has `agent-genesis` entry
   - ✅ `onSelectItem` - Already wired

### Backend API
8. **`ui/src/services/agentService.ts`** ⚠️ **TO CREATE**:
   - ⚠️ `createAgent(manifest: AgentManifest): Promise<AgentCreationResponse>`
   - ⚠️ `forgeAgent(agentId: string): Promise<ForgingResponse>`
   - ⚠️ `getAgentStatus(agentId: string): Promise<AgentStatus>`
   - ⚠️ `validateManifest(manifest: AgentManifest): Promise<ValidationResult>`

9. **`ui/src/api/genesisClient.ts`** ⚠️ **TO CREATE**:
   - ⚠️ `submitGenesisPlan(plan: GenesisPlan): Promise<GenesisResponse>`
   - ⚠️ `getGenesisStatus(genesisId: string): Promise<GenesisStatus>`
   - ⚠️ `subscribeToGenesisEvents(callback: (event: GenesisEvent) => void): Unsubscribe`

---

## C) DEPENDENCY TRACE

```
┌─────────────────────────────────────────────────────────────────────┐
│ TERMINAL → ROUTER → ORCHESTRATOR → PANEL → BACKEND                  │
└─────────────────────────────────────────────────────────────────────┘

1. OPERATOR INPUT
   └─> OperatorInput.tsx
       └─> window.__federationCommandLog.handleCommand()
           └─> OperatorTerminal.tsx.handleCommand()
               └─> routeCommand() [E3 Router]

2. COMMAND ROUTING
   └─> features/operator/commandRouter.ts
       └─> routeCommand(input)
           ├─> Checks knownCommands[] (needs: "agent forge", "agent create")
           ├─> Suggests corrections if needed
           └─> Returns CommandResponse[]

3. COMMAND DISPATCH
   └─> OperatorTerminal.tsx
       └─> Dispatches OPERATOR_COMMAND event
       └─> Could also call: GenesisOrchestrator.handleCommand()

4. GENESIS ORCHESTRATION
   └─> features/agents/orchestrator/GenesisOrchestrator.ts [TO CREATE]
       └─> orchestrateGenesis(manifest)
           ├─> validateManifest() [TO CREATE]
           ├─> submitGenesisRequest() → agentService.createAgent()
           └─> trackGenesisStatus() → genesisClient.subscribeToGenesisEvents()

5. PANEL UI
   └─> features/agents/AgentGenesis.tsx
       └─> "Forge Agent" button onClick
           └─> Calls: GenesisOrchestrator.forgeAgent(manifest)
               └─> Updates UI state (loading, success, error)

6. API CLIENT
   └─> services/agentService.ts [TO CREATE]
       └─> createAgent(manifest)
           └─> POST /api/agents/genesis
               └─> Backend: arcs/lambda/app/main.py (or new service)

7. BACKEND API
   └─> Backend endpoint: POST /api/agents/genesis
       ├─> Validates manifest
       ├─> Creates agent plan
       ├─> Initiates forging workflow
       └─> Returns: { genesisId, status, estimatedTime }

8. STATUS UPDATES
   └─> genesisClient.subscribeToGenesisEvents() [TO CREATE]
       └─> WebSocket: ws://.../federation/genesis
           └─> Receives: { type: "agent.genesis.status", agentId, status, ... }
               └─> Updates AgentGenesis.tsx UI state

9. PANEL REGISTRY
   └─> App.tsx.renderActiveChamber()
       └─> case 'agent-genesis': return <AgentGenesis />
           └─> Rendered in BridgeFrame.tsx right panel

10. SIDEBAR NAVIGATION
    └─> SidebarNavigator.tsx
        └─> Click "Agent Genesis" (id: 'agent-genesis')
            └─> Calls: onSelectItem('agent-genesis')
                └─> App.tsx.setState('agent-genesis')
                    └─> Triggers renderActiveChamber() switch
```

---

## D) MISSING FILES THAT SHOULD EXIST FOR PG-2

### Critical Missing Files:
1. **`ui/src/features/agents/orchestrator/GenesisOrchestrator.ts`**
   - Main orchestrator for agent genesis workflow
   - Coordinates manifest validation, API submission, status tracking

2. **`ui/src/features/agents/orchestrator/agentManifestValidator.ts`**
   - Validates agent manifest structure
   - Checks capability compatibility
   - Validates agent class constraints

3. **`ui/src/services/agentService.ts`**
   - API client for agent operations
   - Functions: `createAgent()`, `forgeAgent()`, `getAgentStatus()`, `listAgents()`

4. **`ui/src/api/genesisClient.ts`**
   - WebSocket client for genesis events
   - HTTP client for genesis API endpoints
   - Event subscription management

### Optional but Recommended:
5. **`ui/src/features/agents/types/agentManifest.ts`**
   - TypeScript types for agent manifests
   - Type definitions for genesis requests/responses

6. **`ui/src/features/agents/orchestrator/genesisStateMachine.ts`**
   - State machine for genesis workflow
   - Manages: draft → validating → forging → deployed states

---

## E) SUMMARY CHECKLIST

### ✅ COMPLETE (Ready for PG-2):
- [x] Terminal command entry points
- [x] Command routing infrastructure
- [x] Agent Genesis UI panel
- [x] Panel registry integration
- [x] Sidebar navigation integration
- [x] Federation WebSocket hook (for genesis events)

### ⚠️ NEEDS WORK:
- [ ] Command router needs `agent forge`/`agent create` commands added
- [ ] AgentGenesis.tsx "Forge Agent" button needs real implementation
- [ ] Manifest validation before forging
- [ ] API client for agent creation
- [ ] Genesis orchestrator logic

### ❌ MISSING (Must Create):
- [ ] `GenesisOrchestrator.ts` - Main orchestrator
- [ ] `agentService.ts` - API client
- [ ] `genesisClient.ts` - WebSocket/HTTP client
- [ ] `agentManifestValidator.ts` - Validation logic

---

**END OF FILE MAP**

