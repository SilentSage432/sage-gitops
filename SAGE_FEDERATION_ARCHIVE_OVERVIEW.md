## 1. Repository & Topology Overview

**Scope of this archive**: The `sage-gitops` repository captures the declarative and procedural surface of the SAGE Federation stack: multi-arc Kubernetes workloads, federation control-plane services, observability, onboarding flows, and the UI/operator consoles. It combines Flux/Kustomize cluster definitions, per-arc application manifests, security baselines, federation-aware backend services, and multiple operator and onboarding experiences.

- **Clusters & environments (high-level)**  
  - `clusters/` encodes cluster-level GitOps entrypoints.  
    - `clusters/prod/` defines production overlays, including `kustomization.yaml` aggregating platform (`platform/`), observability (`observability/`), and Cloudflare/tailscale components.  
    - `clusters/sage/` contains Flux bootstrap state (e.g. `flux-system/kustomization.yaml`, `gotk-components.yaml`) describing the reconciliation machinery itself.  
  - `infra/` defines shared infrastructure within a Flux-managed context: the `namespace.yaml`, `nats.yaml`, and Flux `Kustomization` for `prod` in `kustomization-prod.yaml`, with `patches/prod-ks-namespace.yaml` pinning its namespace.

- **Arcs, services, and applications**  
  - `apps/` contains higher-level applications and system services:  
    - `apps/arcs/` holds arc-level app bases and overlays (e.g. `_base/app/`, `phi/`, `chi/`, `lambda/`, `zeta/`, `ui/`, `rho2/`, `psi/`, `xi/`), used by cluster kustomizations.  
    - `apps/system/coredns/` provides CoreDNS base and overlays for sovereign DNS behavior.  
    - `apps/theta/` defines theta-specific health, DNS, and network policies.  
  - `arcs/` contains arc-specific, often lower-level or standalone manifests and Dockerfiles (`rho2`, `rho2b`, `rho2c`, `omicron`, `mu`, `nu`, `xi`, `iota`, `zeta`, `epsilon`, `delta`, plus an `arc-template`). These are closer to per-arc deployment recipes and prototypes.  
  - `services/` defines auxiliary services like `phi-cortex`, `psi-orchestrator`, and `xenolith-ledger` with Dockerfiles and scripts, representing off-cluster or specialized components in the federation mesh.

- **Control-plane and federation backend**  
  - `backend/` contains the Node.js/Express federation control surface:  
    - `backend/router.js` wires routes for validation, routing, approval, dispatch, simulation, capabilities, candidates, risk, forecast, chain, gate, execution, and operator hardware identity.  
    - `backend/api/*.js` implement HTTP handlers that stay explicitly in "simulation / read-only" mode (e.g. `execution.js`, `federation-state.js`).  
    - `backend/federation/*.js` capture the domain model: execution gate, envelope, channel, simulator, ledger, topology, agent registry, capability graph, rule engine, policy, role privileges, and more.  
    - `backend/identity/` holds `operator-session.js`, modeling operator-related state and current session.  
  - `cli/federation.js` provides a CLI entrypoint into the federation model, reflecting the same conceptual topology as the HTTP APIs.

- **UI, operator experiences, and bridges**  
  - `ui/` is the main SAGE UI (Vite/React + Tailwind), with:  
    - `src/sage/federation/kernel/*` (e.g. `FederationKernelBus.ts`, `FederationAgentRegistry.ts`, `FederationSyncBridge.ts`) modeling a client-side federation kernel and event bus.  
    - `src/features/agents/*`, `src/features/federation/*`, and `src/hooks/*` connecting federation events, node health, and telemetry to UI panels.  
    - `src/components/WhispererTerminal/*` and `src/systems/*` (e.g. rollback, priority, eligibility engines) handling emergent panel behavior as a kind of local mesh.  
  - `arc-bridge-local/` provides a local Node/TypeScript gateway (`src/server.ts`, `src/federation/*`) that mirrors parts of the backend federation model for local testing or bridging SAGE UI to remote federation endpoints.  
  - `onboarding/frontend/` and `onboarding/backend/` provide a separate onboarding experience (Next.js + Go APIs) used to bootstrap tenants, agents, and initial federation routing.  

- **Observability and networking**  
  - `observability/` defines a Flux-managed observability stack (Loki, Promtail, Grafana, Gatus, kube-prometheus, namespaces and network policies) via Kustomize and HelmRelease resources.  
  - `kubernetes/` contains manually curated Kubernetes manifests for arcs (`arc-chi`, `arc-lambda`, `arc-lambda-locked`, `arc-omega`, `arc-sigma`, `arc-ui`), `common/` namespace definitions, `observability/`, and `tailscale/`. These often represent earlier or experimental configurations.  
  - `platform/tailscale/` plus `clusters/prod/platform/tailscale/` express tailscale operator deployment and network policies in a Flux-integrated manner.

- **Security, policies, and secrets**  
  - `rho/kyverno-baseline.yaml` encodes cluster-wide baseline policies via Kyverno ClusterPolicy.  
  - `secrets/` contains SOPS-encrypted secret manifests (e.g. `arc-kappa-db.enc.yaml`, `cloudflare.enc.yaml`, `ghcr-pull.enc.yaml`) plus `README.md` describing age-based key management and Flux + GitHub Actions integration.  
  - `snapshots/` embeds point-in-time YAML exports of key components and network policies, acting as reference snapshots of "known-good" states (e.g., `2025-11-03-theta-rho2-stable-...`).

- **Documentation and scripts**  
  - `docs/` holds arc- and security-focused design documents (`arc-lambda-locked-security.md`, `arc-omega-meaning-layer.md`, `Rho2-Agent-Collective.md`, security maturity and remediation docs).  
  - `FEDERATION_MILESTONES.md` logs phase-based evolution of federation features and guarantees.  
  - `scripts/` contains operational runbooks (e.g. `federation_validate.sh`, `rho2_verify.sh`, `omega-verify-and-demo.sh`, `packet-*` scripts) that encode how the system is validated and repaired from the operator’s perspective.

**Summary of what exists**: The repo is a multi-surface GitOps archive that spans: Flux-based cluster definitions, arc-oriented workloads and network policies, federation control-plane services, UI/kernel abstractions, onboarding flows, and operator scripts and docs. Together, these encode both the desired state of the SAGE Federation and the runtime envelopes through which that state is interrogated, simulated, and verified.

---

## 2. Cluster & Control Plane Topology

**Cluster entrypoints and environments**

- **`clusters/prod/`**  
  - `kustomization.yaml` includes:  
    - `./platform/tailscale` (tailscale operator and related resources).  
    - `./observability` (Loki, Promtail, Grafana, Gatus, kube-prometheus, and related network policies).  
    - `./platform/cloudflared` (Cloudflare tunnel deployment and namespace).  
  - Sub-kustomizations such as `clusters/prod/observability/kustomization.yaml` enumerate specific observability components including `*helmrelease.yaml` and `namespace.yaml`.  
  - `clusters/prod/platform/tailscale/kustomization.yaml` wires namespace and Helm repo/operator HelmRelease for tailscale.  
  - This forms the production cluster’s platform and observability control plane, with Flux reconciling HelmReleases.

- **`clusters/sage/`**  
  - Contains `kustomization.yaml` and `flux-system/kustomization.yaml` plus `gotk-components.yaml`.  
  - `gotk-components.yaml` includes CRDs and controllers (e.g. HelmRelease definitions) that represent the Flux control plane itself.  
  - This directory reflects the bootstrap and ongoing reconciliation mechanism for the SAGE cluster, including Helm and Kustomize controllers.

**Namespaces and arcs**

- **Namespace definitions** appear in multiple places:  
  - `kubernetes/common/namespaces.yaml` lists core namespaces such as `arc-chi`, `arc-omega`, `arc-sigma`, `arc-lambda`, likely `sage-system` or equivalents.  
  - `apps/arcs/*/namespace.yaml` (e.g. `apps/arcs/phi/namespace.yaml`, `apps/arcs/zeta/namespace.yaml`, `apps/arcs/xi/namespace.yaml`, `apps/arcs/psi/namespaces.yaml`) define arc-specific namespaces and labels.  
  - `arcs/*/00-namespace.yaml` and `arcs/*/*.yaml` define additional arc namespaces for rho2, rho2b, rho2c, omicron, mu, nu, xi, etc.  
  - `kubernetes/arc-ui/namespace.yaml`, `kubernetes/observability/ns.yaml`, and tailscale/operator manifests create standard namespaces for UI and observability tools.

- **Arc topology (high-level)**  
  - **Chi (`arc-chi`)**: NATS “hub” and ACL matrix (referenced by scripts and `apps/arcs/chi/base/*`). Arc deployments mount a NATS leaf sidecar pointing to `chi-bus.arc-chi.svc.cluster.local`.  
  - **Omega (`arc-omega`)**: Observes and interprets reason streams and telemetry. `kubernetes/arc-omega/*` and `apps/arcs/omega/*` define the `omega-monitor` deployment and related network policies and ConfigMaps (e.g. `reason-contract.configmap.yaml`, `omega-monitor.patch.yaml`).  
  - **Sigma (`arc-sigma`)**: Telemetry baseline and EMA thresholds (`docs/arc-sigma-baseline.md` and `kubernetes/arc-sigma/*`), with workloads and network policies.  
  - **Lambda / Lambda-locked (`arc-lambda`, `arc-lambda-locked`)**: Application arc and a locked variant with more constrained policies (see `kubernetes/arc-lambda*` and `docs/arc-lambda-locked-security.md`).  
  - **Zeta (`arc-zeta`)**: Websocket bridge and log viewer connectors (see `apps/arcs/zeta/*` and scripts `packet-u3-zeta-websocket-bridge.sh`).  
  - **Theta (`apps/theta/*`)**: Sovereign DNS and DoH path, plus network policies binding CoreDNS to theta DoH endpoints.  
  - **Rho² (`apps/arcs/rho2/*`, `docs/Rho2-Agent-Collective.md`, `rho/kyverno-baseline.yaml`)**: Security hardening, network policy replication, and agent collective boundaries.  
  - Additional arcs (mu, nu, omicron, xi, psi, phi) appear as specialized agents or services, with `apps/arcs/*` and `services/*` bridging them into the mesh.

**Control plane components and roles**

- **Flux controllers (GitOps control plane)**  
  - Present in `clusters/sage/flux-system/gotk-components.yaml` (a full Flux CRD and controller set).  
  - Roles: reconcile `Kustomization` and `HelmRelease` objects, translating Git state in `clusters/`, `infra/`, `observability/`, and possibly `apps/` into cluster state.

- **Helm controllers and releases**  
  - `clusters/prod/observability/*helmrelease.yaml` and `clusters/prod/platform/tailscale/*helmrelease.yaml` define HelmReleases for Loki, Promtail, Grafana, Gatus, kube-prometheus, and tailscale operator.  
  - Roles: control-plane components for logging, metrics, alerting, and secure connectivity.

- **Policy controllers**  
  - Kyverno baseline defined in `rho/kyverno-baseline.yaml` as `ClusterPolicy` `sage-baseline-hardening`.  
  - Cilium network policies (`apps/arcs/rho2/base/rho2-netpol.yaml`, `apps/theta/netpol/theta-netpol.yaml`, tailscale and observability `netpol-*.yaml`) define cluster-level and arc-level egress/ingress behavior enforced by Cilium.  
  - Roles: ensure security baselines (probes, limits, non-root, capabilities) and network isolation.

---

## 3. Declarative Intent vs Operational Reality

**Declarative intent surfaces**

- **Kustomize/Flux manifests**  
  - `clusters/`, `infra/`, `observability/`, `apps/`, `kubernetes/`, `platform/`, `arcs/`, and `templates/` provide the desired state of namespaces, deployments, services, ConfigMaps, NetworkPolicies, HelmReleases, and custom policies.  
  - The `apps/arcs/_base/app/deploy.yaml` template defines the standard arc deployment pattern:  
    - Main container with `NATS_URL=nats://127.0.0.1:4222`.  
    - Sidecar NATS leaf container connecting to `chi-bus.arc-chi.svc.cluster.local:7422`.  
    - Security contexts, resource requests/limits, probes, and volumes for NATS conf and temporary storage.  
  - `rho/kyverno-baseline.yaml` expresses cluster-wide expectations: required probes, CPU/memory limits, non-root seccomp, dropped capabilities, and namespace labels for arc network policies.

- **Security and network policies**  
  - `apps/arcs/rho2/base/rho2-netpol.yaml` defines `CiliumNetworkPolicy` for `rho2-gate` egress, explicitly allowing:  
    - Egress to chi namespace pods on port `4222`.  
    - Egress to kube-dns in `kube-system` on port `53`.  
    - An additional empty rule to implicitly deny any other egress.  
  - `apps/theta/netpol/theta-netpol.yaml` defines Cilium policies:  
    - CoreDNS egress only to DoH service (`cloudflared-doh` in `arc-theta`) on port `5053/TCP`.  
    - Arcs egress DNS only to CoreDNS in `kube-system` on port `53`.  
  - `kubernetes/observability/netpol-*` and `kubernetes/tailscale/netpol-*` define fine-grained traffic allowances among Grafana, Loki, Promtail, tailscale operator, and API server.

- **Database and federation routing**  
  - `onboarding/db/migrations/009_federation_routing.sql` expresses relational intent for multi-database federation:  
    - `federation_nodes` (logical nodes + `database_url`, region, status, priority).  
    - `federation_routing` (tenant + region → `node_id`, `is_primary`, weighted routing).  
    - `tenant_federation_map` (tenant → primary node + region, with metadata).  
    - Default `federation_nodes` entry with node_id `default`, region `us-east`, and a `database_url` built from `current_setting('app.database_url', true)` or a fallback Postgres URL for `sage_os`.  

**Operational reality surfaces**

- **Backend execution and federation behavior**  
  - `backend/router.js` and `backend/api/execution.js` define actual runtime behavior of federation APIs:  
    - Endpoints such as `/federation/action/validate`, `/federation/action/route`, `/federation/action/approve`, `/federation/action/reject`, `/federation/action/dispatch`, `/federation/action/dispatch/simulate`, `/federation/action/dry-run`, `/federation/action/eligible`, `/federation/action/evaluate`, `/federation/action/enforce/simulate`, `/federation/action/channel/init`, `/api/channel/dryrun`, `/api/simulate`, `/api/simulate/diff`, `/execution/gate/preview`, `/execution/envelope`, `/execution/envelope/check`, `/execution/route`, `/execution/simulate`, `/execution/ledger`.  
    - Each handler is explicitly annotated as “read-only”, “simulation”, or “no execution/state changes”, reflecting an operational design where the backend acts as an analysis, gating, and simulation plane rather than an executor of external effects.  
  - `backend/api/federation-state.js` collects:  
    - `virtualBus` log from `virtual-bus.js`.  
    - `agentCapabilities` and agent registry from `agent-capabilities.js` and `agent-registry.js`.  
    - Current operator from `identity/operator-session.js` and its `hardwareKey` from `operator-model.js`.  
    - This forms an operational "state-of-federation" view for UI clients and operators, distinct from Git-defined infrastructure.

- **Client-side kernel and events**  
  - `ui/src/sage/federation/kernel/FederationKernelBus.ts` defines a browser-local event bus:  
    - Typed `FederationEvent` variants for agent lifecycle (`*.agent.*`), agent errors, and federation log entries.  
    - `emitEvent` and `onEvent`/`onAny` listeners with error-guarded dispatch loops.  
    - This bus is an in-memory operational layer that multiplexes federation-related events to UI subsystems, decoupled from the server’s declarative configuration.  
  - Other kernel components (`FederationAgentRegistry`, `FederationSyncBridge`, `useFederationWS`, `useMeshTelemetry`, `useNodeEvents`) bind WebSocket and REST streams into the UI event bus.

- **Bridging and local proxies**  
  - `arc-bridge-local` implements a local Node/TypeScript server with routes like `routes/federation.ts`, `routes/actions.ts`, `routes/operator.ts`, and federation modules (`topology.ts`, `intent.ts`, `divergence.ts`, `commandQueue.ts`).  
  - Operationally, this service acts as an intermediary for local development or “arc bridge” flows between the UI and the backend/federation core, while still using the same conceptual vocabulary (execution envelope, topology, divergence).

**Declarative vs runtime distinction**

- Declarative intent is carried by YAML, Kustomize, HelmRelease, and SQL migrations; it describes desired infrastructure, security, and data layouts.  
- Operational reality is encoded in Node.js, Go, TypeScript, and scripts; it defines how federation state is observed, simulated, verified, and surfaced to human operators and UI kernels.  
- The overall design treats the backend and UI as **simulation engines and control surfaces** over a GitOps-defined substrate, rather than as primary mutation channels for cluster state.

---

## 4. Security, Identity, and Trust Boundaries

**RBAC and policy baselines**

- **Kyverno baseline (`rho/kyverno-baseline.yaml`)**  
  - Enforces via `ClusterPolicy` `sage-baseline-hardening`:  
    - `require-probes`: Deployments/StatefulSets must define startup/readiness/liveness probes.  
    - `require-limits`: Deployments/StatefulSets must define CPU/memory requests and limits.  
    - `non-root-seccomp`: Workloads must run as non-root with seccomp `RuntimeDefault`.  
    - `require-security-context`: Containers must drop all capabilities and disallow privilege escalation.  
    - `require-network-policies`: Namespaces labeled `sage.arc: "true"` are expected to have NetworkPolicies for defense in depth.  
  - This defines a global expectation for workload hardening and network segmentation.

- **Network policies and service segregation**

  - **Cilium egress policies**:  
    - `apps/arcs/rho2/base/rho2-netpol.yaml` restricts `rho2-gate` pods to:  
      - Egress to `arc-chi` pods on port `4222` (NATS).  
      - Egress to `kube-dns` in `kube-system` on port `53`.  
      - Implicitly deny other outbound traffic.  
    - `apps/theta/netpol/theta-netpol.yaml` constrains:  
      - CoreDNS egress to `cloudflared-doh` in `arc-theta` on port `5053/TCP`.  
      - Arcs’ DNS egress to CoreDNS in `kube-system` on port `53`.  
  - **Kubernetes NetworkPolicies** (e.g. in `kubernetes/arc-ui/`, `kubernetes/observability/`, `kubernetes/tailscale/`):  
    - Govern traffic between Grafana and Loki, Promtail and Loki, tailscale operator and API server, and the UI’s ingress/egress patterns.  
  - **Snapshots** record previously enforced network policy sets for arcs, showing historical “locked” connectivity matrices.

**Identity layers**

- **Service identity / NATS identity**  
  - Arc deployments (via `apps/arcs/_base/app/deploy.yaml`) include:  
    - Sidecar NATS leaf with environment variables `NATS_USER` and `NATS_PASS` obtained from `Secret` references (`secretKeyRef: { name: NATS_SECRET, key: user/pass }`).  
    - Labels like `rho2.identity: ARCIDENT` and `rho2.tier: app` which are used for policy and gate logic (e.g. `rho2` gating, netpols).  
  - `scripts/federation_validate.sh` uses secrets like `omega-nats-auth`, `sigma-nats-auth`, and `lambda-nats-auth` to extract `NATS_URL` values and validate connectivity, showing that NATS credentials are the runtime identity for arc communication.

- **Operator and hardware identity (backend)**  
  - `backend/identity/operator-session.js` plus `backend/federation/operator-model.js` and `backend/api/operator.js` model:  
    - The concept of a current operator (session-level identity).  
    - An associated hardware key (`hardwareKey`) registered via `/api/operator` endpoints (e.g. WebAuthn or hardware tokens).  
  - `backend/api/federation-state.js` merges `operator` identity and `hardwareKey` into the state payload, exposing them to the UI for awareness and enforcement modelling.  
  - `backend/federation/hardware-challenge.js` and `hardware-verify.js` (referenced in `backend/federation/*`) define verification of hardware-bound identities, anchoring trust in physical keys.

- **Tenant and database identity (onboarding)**  
  - `onboarding/db/migrations/*` (including `009_federation_routing.sql`) define tables like `tenants`, `federation_nodes`, `federation_routing`, and `tenant_federation_map`.  
  - These encode identity at the tenant level and map that identity onto physical or logical database nodes (`database_url` per node, region, priority).

**Secrets and encryption**

- **SOPS + age**  
  - `secrets/README.md` describes:  
    - Generating an age key and storing the private key in a Flux `sops-age` secret (namespace `flux-system`).  
    - Storing the same key material in GitHub Actions as `SOPS_AGE_KEY`.  
    - Encrypting secrets like `arc-kappa-db.enc.yaml` via `sops --encrypt --age ...`.  
    - Applying secrets via Flux or direct `kubectl`.  
  - This design places secret material outside the repo (private), while the encrypted manifest is declaratively stored in Git.

**Trust boundaries**

- **Git as desired-state authority**  
  - Cluster resources (namespaces, deployments, HelmReleases, NetworkPolicies) are reconciled from Git via Flux, making Git the authoritative description of cluster shape and baseline behavior.  
  - Secrets are stored in encrypted form in Git but decrypted by Flux/SOPS at reconcile time.

- **NATS Mesh as runtime message plane**  
  - Arc applications use NATS (chi hub and leaf sidecars) as their primary communication channel.  
  - NetworkPolicies and Cilium rules constrain which pods can speak to NATS and under what conditions, forming runtime trust boundaries around message flow.

- **Backend as policy/gate authority (simulation plane)**  
  - The Node.js backend defines the logic for action gating, simulation, routing, and ledgering, and is treated as the authority for “what would be allowed” and “what is observed” rather than direct mutators of cluster state.  
  - Operator + hardware identity is anchored here, and UIs consult this plane to understand allowed actions and risk.

---

## 5. Federation Assumptions (State, Identity, Authority)

**State assumptions**

- **Git and Flux**  
  - `clusters/` and `infra/` imply that desired cluster state is versioned in Git and continually reconciled by Flux controllers.  
  - `kustomization-prod.yaml` and patching of Flux Kustomization names/namespace indicate an assumption that a small set of Flux objects drive the majority of infrastructure reconciliations.  

- **Database and routing state**  
  - `onboarding/db/migrations/009_federation_routing.sql` assumes a PostgreSQL database `sage_os` with `public` schema and existing `tenants` and `update_updated_at_column()` function.  
  - Federation state in the database is multi-layered:  
    - `federation_nodes` are canonical records of where data can live (node_id, region, database_url).  
    - `federation_routing` describes how tenants and regions map to nodes, including primary/secondary and weight.  
    - `tenant_federation_map` anchors each tenant to a primary node and region.  
  - The migration seeds a default federation node using Postgres settings or a fallback local URL, assuming the default node stands in for the “current single-node reality” and can be expanded later.

**Identity assumptions**

- **Tenants and regions**  
  - Migrations assume that tenants can be uniquely identified and bound to regions and nodes via federation tables, enabling multi-region and multi-database scenarios.  
  - Each `tenant_id` appears once in `tenant_federation_map`, implying a single canonical primary node per tenant at any point in time.

- **Operator & hardware**  
  - Backend APIs assume that an operator session and hardware key can be established and queried at runtime, and that future enforcement will use these identities to gate actions.  
  - Federation endpoints are built around the assumption of a future “soft execution” mode, where the same APIs can transition from simulation-only to enforcement-aware without changing their external shape.

- **Arc & service identity**  
  - Arc workloads assume NATS-based identities mediated by secrets and arc-specific labels (e.g. `rho2.identity`, `rho2.tier`).  
  - Network policies in Rho² and Theta assume that arcs will always have a central Chi bus and a sovereign DNS path, rather than arbitrary external connections.

**Authority assumptions**

- **Sources of truth**
  - **Git**: authoritative for cluster topology, infrastructure, and security posture.  
  - **Flux + Helm + controllers**: authoritative for what is actually applied to clusters, converging runtime to Git.  
  - **Postgres (`sage_os`)**: authoritative for tenant, federation node, and routing metadata, as well as onboarding state.  
  - **Backend federation model**: authoritative for policy evaluation, risk scoring, gating decisions, and event logs.  
  - **NATS**: authoritative for message-level interactions among arcs (events, telemetry, signals).

- **Trust layering**
  - Declarative Git + Flux form the base infrastructure authority.  
  - Database-level federation tables and tenant models add a data-plane authority layer above.  
  - Backend federation services add a control-plane authority layer for actions, policies, and simulations.  
  - UI/kernel components reflect these authorities and present them as observable, event-driven state to operators.

---

## 6. Event Flow & Orchestration

**Message-level event flow (NATS)**

- Arc deployments (per `apps/arcs/_base/app/deploy.yaml`) contain:  
  - A primary container speaking to `NATS_URL=nats://127.0.0.1:4222`.  
  - A NATS leaf sidecar connecting to the Chi hub (`chi-bus.arc-chi.svc.cluster.local:7422`).  
  - Egress network policies (especially in Rho²-related manifests) that restrict outbound traffic to Chi and DNS only.  
- `scripts/federation_validate.sh` describes an operational NATS flow:  
  - Spawns a `nats-box` pod in `arc-omega`.  
  - Extracts `NATS_URL` from NATS auth secrets in `arc-omega`, `arc-sigma`, and `arc-lambda`.  
  - Publishes test messages (e.g. `omega.reason`, `sigma.telemetry`, `lambda.events`) and reads logs or subscriptions from `omega-monitor`.  
  - This script encodes the expected flow: arcs publish onto NATS subjects; Omega’s monitor consumes; operators verify connectivity and receipt.

**Backend federation events and logs**

- `backend/federation/virtual-bus.js` (referenced by `backend/api/federation-state.js`) models a virtual event bus:  
  - `getVirtualBusLog()` returns a log of virtual events processed or simulated through the federation backend.  
  - This bus is separate from NATS; it is a conceptual bus used to describe enforcement and routing events at the policy layer.  
- `backend/federation/execution-ledger.js` and `/execution/ledger` API expose an in-memory or file-backed ledger of execution attempts:  
  - The ledger records `envelope`, `gate` results, hardware validation, and simulation outcomes.  
  - APIs remain passive: no real execution or blocking is performed; ledger entries are used for audit and future enforcement modelling.

**UI kernel events and orchestration**

- `ui/src/sage/federation/kernel/FederationKernelBus.ts` defines a browser-local event bus with events like:  
  - `federation.agent.created` / `federation.agent.forged` (new agent manifests).  
  - `federation.agent.status` (agent lifecycle updates).  
  - `federation.agent.error` (errors surfaced to the operator UI).  
  - `federation.log.append` (append-only federation logs).  
- This bus is used by:  
  - Orchestrators (`features/agents/orchestrator/GenesisOrchestrator.ts`, `genesisStateMachine.ts`).  
  - Federation health and telemetry features (`useFederationNodes`, `useMeshTelemetry`, `useNodeEvents`, `useNodeFusionTelemetry`).  
  - Kernel-level registries (`KernelSignalRegistry`) for mapping signals to UI reactions.  
- The combination of WebSocket hooks (`useFederationWS`, `usePredictiveWS`, `useNodeSignalStream`) and the kernel bus forms an event pipeline from backend/bridge to UI, with all events converging into the bus for distribution to panels and consoles.

**Orchestration of actions**

- **Action lifecycle (backend)**  
  - From `backend/router.js` and `backend/api/execution.js`:  
    - Validate → Route → Approve/Reject → Dispatch (virtual) → Simulate dispatch → Dry-run executor → Enforcement simulation → Execution envelope and gate preview → Full execution simulation with ledger.  
  - Each stage emits events/logs to internal modules (virtual bus, ledger, rule engine), creating an end-to-end picture of “would this action be allowed?” and “what would happen?” without executing side effects.  
- **Orchestration across components**  
  - The backend orchestrates policy evaluation and gating.  
  - NATS orchestrates inter-arc communication and telemetry.  
  - The UI kernel orchestrates event distribution, panel lifecycle, and agent visualizations.  
  - Operator scripts orchestrate validation flows such as verifying NATS connectivity or network policies.

---

## 7. Persistence vs In-Memory Behavior

**Persistent state**

- **Databases (Postgres `sage_os`)**  
  - `onboarding/db/migrations/*.sql` define tenant, agent, audit log, bootstrap kits, activity events, identity config, tenant agents status, and federation routing tables.  
  - `009_federation_routing.sql` adds federation-specific tables and seeds a `default` node with a `database_url` to the current database.  
  - These migrations assume a persistent relational store with UUID primary keys, JSONB metadata, and timestamp columns maintained by triggers.  

- **Kubernetes resources**  
  - Namespaces, Deployments, Services, ConfigMaps, Secrets (via SOPS), NetworkPolicies, HelmReleases, and Kyverno ClusterPolicies are persisted in the Kubernetes API, with Git-managed manifests acting as their declarative source.  
  - NATS itself (Chi hub, arc leafs) stores ephemeral messages but uses persistent configuration from ConfigMaps and Secrets.

- **Configuration archives and snapshots**  
  - `snapshots/` store static YAML exports of arc-specific network policies and configurations; these act as reference anchor points rather than live configuration.  
  - `omega-monitor-backup.yaml` and related files capture specific backup or patch states for arc components.

**In-memory and ephemeral behavior**

- **Backend in-memory structures**  
  - Virtual bus logs, execution ledgers, simulation results, and agent registries in `backend/federation/*.js` appear to be in-memory structures (based on JS modules and JSON payloads), not persisted to a database.  
  - Operator sessions and hardware keys are likely persisted via identity models, but the runtime view in `federation-state` is constructed on-demand at request time.

- **UI kernel and event bus**  
  - `FederationKernelBus` and related registries exist purely in browser memory, resetting on reload.  
  - Panel states, local caches, and telemetry streams are ephemeral client-side constructs.

- **Operational scripts and probes**  
  - Shell scripts (e.g. `federation_validate.sh`) create short-lived pods (`nats-box`) and ephemeral connections to NATS and arc services; their effects are not persisted beyond logs and human observation.  
  - Many validation scripts use `kubectl` reads and ephemeral pods as runtime verification tools, distinct from declarative configuration.

---

## 8. Failure, Drift, and Recovery Handling

**Failure detection and telemetry**

- **Observability stack**  
  - via `observability/kustomization.yaml` and `clusters/prod/observability/*`:  
    - Loki + Promtail for log aggregation.  
    - Grafana for dashboards and alerting.  
    - Gatus for external/HTTP endpoint health checks.  
    - kube-prometheus stack for metrics and alerting rules.  
  - `kubernetes/observability/*.yaml` further refines ingress/egress between Promtail, Loki, Grafana, and the cluster API, shaping how log/metric flows function and how failures manifest in dashboards.

- **Omega monitor and reason contract**  
  - `kubernetes/arc-omega/omega-monitor-metrics.svc.yaml`, `omega-monitor.patch.yaml`, and `apps/arcs/omega/quarantine-dumper.yaml` show Omega’s role in:  
    - Watching NATS subjects for reason codes.  
    - Mounting `reason-contract` ConfigMap into `/etc/omega/reason-contract.json` and exposing metrics on port `8081`.  
  - Failures in arc communication or reason code flows would be represented in Omega’s logs and metrics, which can be accessed via `federation_validate.sh` and observability tooling.

**Drift handling**

- **GitOps reconciliation**  
  - Flux controllers, as defined in `clusters/sage/flux-system/gotk-components.yaml`, periodically reconcile `Kustomization` and `HelmRelease` resources:  
    - If cluster state drifts from Git manifests, Flux re-applies manifests to restore the desired state.  
    - If Helm chart values drift, HelmRelease reconciliation brings them back to defined configuration.  
  - Drift at the database level (tenant routing) is controlled by migrations and application logic rather than GitOps.  

- **Policy and network drift**  
  - Kyverno and Cilium policies define baseline expectations. If workloads are created without required probes or limits, Kyverno can audit (and potentially enforce) violations.  
  - NetworkPolicies (Kubernetes and Cilium) ensure that deviations in connectivity (e.g. unauthorized egress) are blocked at runtime, even if application code attempts to communicate outside the allowed boundaries.

**Recovery patterns**

- **Operational scripts**  
  - `rho2_verify.sh`, `phi-nats-fix.sh`, `packet-f1-1-arc-credential-sync.sh`, `packet-f1-2-omega-connection-normalization.sh`, `packet-f1-3-fix-leafnode-connectivity.sh`, `packet-f1-3-omega-sidecar-leafnode.sh`, `packet-omega2-meaning-init.sh`, `u3-recover-and-verify.sh`, and similar scripts encode step-by-step recovery and verification flows.  
  - These scripts often:  
    - Inspect pods, services, and secrets.  
    - Recreate or restart components (e.g. NATS sidecars, nats-box pods).  
    - Send test messages and check logs for expected markers.  
  - The pattern is: use ephemeral tests and targeted resets to validate and re-establish mesh connectivity.

- **Snapshot-based reference**  
  - `snapshots/` provide prior "known good" states for network policies and configurations, helping operators reason about differences and restore previous shapes if necessary.  
  - `omega-monitor-backup.yaml` and similar files encode explicit backup states for key services.

---

## 9. Emergent Design Philosophy

**Architectural style**

- The repository combines:  
  - **GitOps + Flux** for cluster and infrastructure state.  
  - **Message-oriented NATS mesh** for inter-arc communication.  
  - **Policy-centric backend** focused on simulation, gating, and evaluation, rather than direct execution.  
  - **Event-driven UI kernel** that treats federation events as a stream to be observed and orchestrated, not just static data to be rendered.  
- Phases and milestones (e.g. comments in `backend/router.js` and `FEDERATION_MILESTONES.md`) are used to structure the evolution of capabilities in small, observable increments.

**Separation of concerns**

- Infrastructure state and security posture are **declarative** (YAML, Kustomize, Helm, SQL migrations).  
- Federation logic and operator interactions are **procedural and event-driven** (backend Node.js modules, UI kernel bus, local arc-bridge).  
- The UI is treated as a **federation kernel in the browser**, mirroring patterns from the backend (event buses, registries, orchestration primitives).

**Safety and simulation bias**

- Backend APIs are explicitly described as:  
  - Read-only, simulation-only, or passive.  
  - “Execution always disabled”, “no state changes”, and “no blocking” appear consistently in comments and responses.  
- This indicates an intentional design where:  
  - The system first models, simulates, and logs potential actions and their implications.  
  - Execution is framed as a later, optional evolution of the same interface.

**Federation as layered authority**

- Authority appears layered across:  
  - Git (desired infra).  
  - Flux/Helm (realized infra).  
  - Postgres (tenant and federation topology).  
  - Backend federation model (policy and gating).  
  - NATS (runtime message topology).  
  - UI kernels and operator consoles (human-visible perception of the mesh).  
- This layering allows the federation to express both **hard boundaries** (network policies, Kyverno) and **soft reasoning** (reason contracts, risk scores, forecasts) in parallel.

---

## 10. Future Review Markers (Optional, Non-Directive)

**Note**: The following markers are descriptive pointers for potential future analysis. They are not prescriptions or recommendations.

- **Marker A: Alignment between declarative and procedural topology**  
  - Area for future review: compare the cluster/arc topology described in `clusters/`, `apps/`, `arcs/`, and `kubernetes/` manifests with the topology implied by backend federation modules (`topology.js`, `agent-registry.js`, NATS subjects, and UI federation kernel components) to understand how closely the runtime view matches the declarative model.

- **Marker B: Federation routing state and operational usage**  
  - Area for future review: inspect how `federation_nodes`, `federation_routing`, and `tenant_federation_map` tables (declared in `onboarding/db/migrations/009_federation_routing.sql`) are populated and consumed by services, to map the lived data-plane behavior of multi-node, multi-region routing.

- **Marker C: NATS mesh boundaries and network policies**  
  - Area for future review: examine how Cilium and Kubernetes NetworkPolicies (e.g. in `apps/theta/netpol/`, `apps/arcs/rho2/base/`, `kubernetes/tailscale/`, `kubernetes/observability/`) shape the effective NATS subject and connection graph, especially for cross-arc and cross-environment flows.

- **Marker D: Execution ledger and virtual bus persistence**  
  - Area for future review: trace how the execution ledger and virtual bus logs (in `backend/federation/*`) are retained, rotated, or externalized, and how they intersect with observability stacks (Loki, Grafana, Gatus) for unified failure analysis.

- **Marker E: UI federation kernel and cross-console interaction**  
  - Area for future review: map the role of `FederationKernelBus`, `KernelSignalRegistry`, panel orchestrators, and `arc-bridge-local` in shaping multi-console behavior, and how this event fabric interacts with backend federation APIs and NATS streams in practice.


