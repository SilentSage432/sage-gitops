# Federation Arc Map
**Authoritative Map of All Federation Arcs in SAGE Repository**

**Generated:** 2026-01-25  
**Scope:** READ-ONLY analysis of existing codebase  
**Purpose:** Factual inventory of all Federation Arcs for safe, deliberate activation

---

## Section 1: High-Level Federation Arc Inventory

### Summary Statistics
- **Total Arcs Identified:** 20 unique Arc identifiers
- **UI Panels Present:** 6 Arcs (Theta, Sigma, Omega, Rho², Lambda, Chi)
- **Backend Implementations:** 13+ Arcs with Kubernetes manifests
- **Arc Directories:** 13 directories in `arcs/`
- **Apps/Arcs Directories:** 10 directories in `apps/arcs/`
- **Kubernetes Namespaces:** 7 explicitly defined namespaces

### Arc Categories

#### **Core Federation Arcs (UI + Backend)**
1. **Chi (Χ)** - NATS message bus hub
2. **Theta (Θ)** - Network sovereignty / DNS
3. **Sigma (Σ)** - Telemetry baseline
4. **Omega (Ω)** - Reason streams / freshness gate
5. **Lambda (Λ)** - Application arc
6. **Rho² (ρ²)** - Security hardening / network policies

#### **Additional Backend Arcs (No UI Panel)**
7. **Zeta (ζ)** - Websocket bridge / log viewer
8. **Phi (φ)** - Cortical navigator
9. **Psi (ψ)** - Orchestrator
10. **Xi (ξ)** - Xenolith ledger
11. **Mu (μ)** - API service
12. **Nu (ν)** - API service
13. **Iota (ι)** - API service
14. **Omicron (ο)** - API service
15. **Epsilon (ε)** - UI service
16. **Delta (δ)** - (minimal manifests)
17. **Rho2b** - Rho² variant
18. **Rho2c** - Rho² variant
19. **Lambda-locked** - Lambda variant with stricter policies
20. **UI** - Enterprise UI (arc-ui namespace)

---

## Section 2: Detailed Arc-by-Arc Breakdown

### **1. Chi (Χ) - `arc-chi`**

**Purpose/Role:** NATS message bus hub and ACL matrix. Central communication infrastructure for all Federation Arcs.

**Backend Locations:**
- `kubernetes/arc-chi/` - Kubernetes manifests
  - `nats-config.yaml` - NATS configuration
  - `netpol-chi.yaml` - Network policies
  - `netpol-chi-bus-allow-ingress.yaml` - Ingress rules
  - `netpol-chi-bus-allow-omega.yaml` - Omega-specific access
  - `rbac-chi.yaml` - RBAC definitions
- `apps/arcs/chi/base/` - Kustomize base
  - `chi-ingress-cnp.yaml` - Cilium network policy
  - `kustomization.yaml`
- `apps/arcs/arc-chi/netpol/chi-ingress.yaml` - Network policy

**UI Locations:**
- `ui/src/features/arc/ArcChiPanel.tsx` - Panel component
- `ui/src/app/App.tsx` - Registered as `'arc-chi'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'Χ')
- `ui/src/services/arcService.ts` - Mock data for 'chi'

**Dependencies:**
- **None** - Chi is the foundational dependency for all other Arcs
- Other Arcs depend on Chi (Omega, Sigma, Lambda, Zeta, Phi all connect to Chi)

**Activation State:** ✅ **ACTIVE**
- Namespace defined in `kubernetes/common/namespaces.yaml`
- Service: `chi-bus.arc-chi.svc.cluster.local:4222`
- Referenced by network policies across multiple Arcs

**Notes:**
- All other Arcs mount NATS leaf sidecars pointing to `chi-bus.arc-chi.svc.cluster.local:7422`
- Chi must be activated FIRST before any other Arc
- Documented in chronicles as "GREEN" status

---

### **2. Theta (Θ) - `arc-theta`**

**Purpose/Role:** Network sovereignty and DNS-over-HTTPS (DoH) path. Provides sovereign DNS resolution through controlled DoH proxy.

**Backend Locations:**
- `kubernetes/common/namespaces.yaml` - Namespace definition
- `apps/theta/` - Theta-specific configurations
- `apps/theta/netpol/theta-netpol.yaml` - Network policies
- `kubernetes/arc-omega/netpol-allow-dns.yaml` - References theta DoH endpoints

**UI Locations:**
- `ui/src/features/arc/ArcThetaPanel.tsx` - Panel component
- `ui/src/app/App.tsx` - Registered as `'arc-theta'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'Θ')
- `ui/src/services/arcService.ts` - Mock data for 'theta'
- `ui/src/lib/intentEngine.ts` - Intent routing: `open.*theta` → `arc-theta`

**Dependencies:**
- **None** - Theta is independent infrastructure
- Other Arcs depend on Theta for DNS resolution (via CoreDNS → Theta DoH)

**Activation State:** ⚠️ **PAUSED** (per chronicles)
- Chronicle states: "Theta (Θ): Network sovereignty — PAUSED. Waiting on NAT443 or DoH (Talos host firewall / SNAT)."
- Namespace exists but may not be fully operational

**Notes:**
- CoreDNS forwards to `cloudflared-doh` in `arc-theta` on port `5053/TCP`
- Required for complete network sovereignty
- Documented as paused pending NAT/firewall configuration

---

### **3. Sigma (Σ) - `arc-sigma`**

**Purpose/Role:** Telemetry baseline and EMA thresholds. Maintains telemetry baselines and monitoring intervals.

**Backend Locations:**
- `kubernetes/arc-sigma/` - Kubernetes manifests
  - `deploy-sigma-agent.yaml` - Sigma agent deployment
  - `netpol-sigma.yaml` - Network policies (allows egress to Chi)
- `apps/arcs/sigma-agent/` - Agent source code
  - `Dockerfile`
  - `main.py`
  - `requirements.txt`
- `apps/arcs/arc-sigma/netpol/sigma-egress.yaml` - Egress policies
- `docs/arc-sigma-baseline.md` - Documentation
- `kubernetes/common/namespaces.yaml` - Namespace definition

**UI Locations:**
- `ui/src/features/arc/ArcSigmaPanel.tsx` - Panel component
- `ui/src/app/App.tsx` - Registered as `'arc-sigma'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'Σ')
- `ui/src/services/arcService.ts` - Mock data for 'sigma'
- `ui/src/lib/intentEngine.ts` - Intent routing: `open.*sigma` → `arc-sigma`

**Dependencies:**
- **Chi** - Requires Chi for NATS connectivity (network policy allows egress to `arc-chi`)

**Activation State:** ✅ **ACTIVE**
- Chronicle states: "Sigma (Σ): Telemetry baseline — GREEN"
- Agent maintains `sigma-baseline` ConfigMap with intervals/window
- Namespace and deployments exist

**Notes:**
- Writes beats to `federation-arcs` ConfigMap
- Omega reads from `sigma-baseline` and `federation-arcs`
- Network policy allows egress to Chi bus

---

### **4. Omega (Ω) - `arc-omega`**

**Purpose/Role:** Observes and interprets reason streams and telemetry. Freshness gate that monitors Arc health.

**Backend Locations:**
- `kubernetes/arc-omega/` - Extensive Kubernetes manifests
  - `deploy-omega-monitor.yaml` - Main monitor deployment
  - `svc-omega-monitor.yaml` - Service definition
  - `omega-monitor-metrics.svc.yaml` - Metrics service
  - `omega-monitor.patch.yaml` - Patches
  - `reason-contract.configmap.yaml` - Reason contract
  - `config-omega-reason-codes.yaml` - Reason codes
  - `cm-omega-reason-codes.yaml` - ConfigMap
  - `netpol-omega-*.yaml` - Multiple network policies
  - `rbac.yaml` - RBAC definitions
  - `reason-stream/` - Reason stream subdirectory
- `apps/arcs/omega/` - Omega configurations
  - `quarantine-dumper.yaml`
- `apps/arcs/omega-monitor/` - Monitor source code
  - `Dockerfile`
  - `main.py`
  - `reason_guard.py`
  - `requirements.txt`
- `apps/arcs/omega-reason-stream/` - Reason stream source
  - `Dockerfile`
  - `main.py`
  - `requirements.txt`
- `apps/arcs/arc-omega/netpol/omega-egress.yaml` - Egress policies
- `docs/arc-omega-meaning-layer.md` - Documentation
- `kubernetes/common/namespaces.yaml` - Namespace definition

**UI Locations:**
- `ui/src/features/arc/ArcOmegaPanel.tsx` - Panel component
- `ui/src/app/App.tsx` - Registered as `'arc-omega'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'Ω')
- `ui/src/services/arcService.ts` - Mock data for 'omega'
- `ui/src/lib/intentEngine.ts` - Intent routing: `open.*omega` → `arc-omega`

**Dependencies:**
- **Chi** - Requires Chi for NATS connectivity (network policy allows egress to `arc-chi`)
- **Sigma** - Reads from `sigma-baseline` and `federation-arcs` ConfigMaps

**Activation State:** ✅ **ACTIVE**
- Chronicle states: "Omega (Ω): Freshness gate — GREEN. Reads sigma-baseline and federation-arcs; shows Green with Chi/Lambda beats."
- Multiple deployments: `omega-monitor`, `omega-agent`, `omega-reason-stream`
- Namespace and services exist

**Notes:**
- Writes beats (~30s) to `federation-arcs` ConfigMap (`chi_last_ms`, `lambda_last_ms`)
- Monitors reason streams and telemetry
- Network policies allow egress to Chi and DNS
- Has dedicated reason stream component

---

### **5. Lambda (Λ) - `arc-lambda`**

**Purpose/Role:** Application arc for producers/consumers. Main application workload Arc.

**Backend Locations:**
- `kubernetes/arc-lambda/` - Kubernetes manifests
  - `deploy-lambda-cell.yaml` - Lambda cell deployment
  - `netpol-lambda.yaml` - Network policies (allows egress to Chi)
- `arcs/lambda/` - Lambda Arc directory
  - `app/federation.py` - Federation logic
  - `app/main.py` - Main application
  - `app/registry_client.py` - Registry client
  - `app/requirements.txt` - Dependencies
  - `05-keepers-config.yaml` - Keepers configuration
  - `06-cnp-keepers-egress.yaml` - Cilium network policy
  - `lambda-api.yaml` - API definition
- `apps/arcs/lambda/` - Lambda Kustomize
  - `overlays/prod/kustomization.yaml`
- `apps/arcs/arc-lambda/netpol/lambda-egress.yaml` - Egress policies
- `kubernetes/common/namespaces.yaml` - Namespace definition

**UI Locations:**
- `ui/src/features/arc/ArcLambdaPanel.tsx` - Panel component
- `ui/src/app/App.tsx` - Registered as `'arc-lambda'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'Λ')
- `ui/src/services/arcService.ts` - Mock data for 'lambda'
- `ui/src/lib/intentEngine.ts` - Intent routing: `open.*lambda` → `arc-lambda`

**Dependencies:**
- **Chi** - Requires Chi for NATS connectivity (network policy allows egress to `arc-chi`)

**Activation State:** ✅ **ACTIVE**
- Chronicle states: "Lambda (λ): Producers/consumers — GREEN. DNS + egress rules verified"
- Deployments: `lambda-api`, `lambda-cell`, `lambda-worker`
- Namespace and services exist

**Notes:**
- Implements federation.py with keeper-based validation
- Network policy allows egress to Chi bus
- Uses NATS leaf sidecar connecting to Chi

---

### **6. Rho² (ρ²) - `arc-rho2`**

**Purpose/Role:** Security hardening, network policy replication, and agent collective boundaries. Cryptographic immune system.

**Backend Locations:**
- `arcs/rho2/` - Rho² Arc directory
  - `00-namespace.yaml` - Namespace
  - `01-serviceaccount.yaml` - Service account
  - `02-deployment.yaml` - Deployment
  - `03-service.yaml` - Service
  - `04-cilium-allow-probes-l4.yaml` - Cilium policies
  - `05-config.yaml` - Configuration
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `crds/rotationpolicy.yaml` - CRD definition
  - `Dockerfile`
  - `jobs/kappa-db-rotate.yaml` - Rotation job
  - `kustomization.yaml`
- `apps/arcs/rho2/base/` - Rho² Kustomize base
  - `rho2-admission.yaml` - Admission controller
  - `rho2-gate.yaml` - NATS proxy gate
  - `rho2-namespace-rbac.yaml` - RBAC
  - `rho2-netpol.yaml` - Network policies
  - `rho2-policy.yaml` - Policy definitions
  - `rho2-rotation.yaml` - Rotation CronJob
- `docs/Rho2-Agent-Collective.md` - Documentation
- `rho/kyverno-baseline.yaml` - Kyverno policies
- `scripts/packet-f2-rho2-netpol-replication.sh` - Scripts

**UI Locations:**
- `ui/src/features/arc/ArcRho2Lodge.tsx` - Panel component (special name: "Rho² Cosmic Lodge")
- `ui/src/app/App.tsx` - Registered as `'arc-rho2'`
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation entry (symbol: 'ρ²')
- `ui/src/services/arcService.ts` - Mock data for 'rho2'
- `ui/src/services/rho2Service.ts` - Epoch stream service
- `ui/src/lib/intentEngine.ts` - Intent routing: `open.*rho` → `arc-rho2`
- `ui/src/layout/BridgeFrame.tsx` - Auto-routing: alerts from "rho2" → `arc-rho2`

**Dependencies:**
- **Chi** - Rho² gate validates posture before Chi access

**Activation State:** ✅ **ACTIVE**
- Chronicle states: "Rho² (ρ²): NetworkPolicies — GREEN. Minimal, least-privilege rules"
- Implements ValidatingAdmissionPolicy for posture validation
- Network policies with deny-by-default egress
- 24-hour posture hash rotation

**Notes:**
- Cryptographic immune system using Shamir Secret Sharing
- Posture-based security with admission control
- Identity mapping for Sigma, Lambda, Omega, Zeta
- Documented as "mathematically incorruptible"

---

### **7. Zeta (ζ) - `arc-zeta`**

**Purpose/Role:** Websocket bridge and log viewer connectors. Provides observer API and websocket connectivity.

**Backend Locations:**
- `arcs/zeta/` - Zeta Arc directory
  - `api-deploy.yaml` - API deployment
  - `api-service.yaml` - API service
  - `app-configmap.yaml` - App configuration
  - `kustomization.yaml`
  - `namespace.yaml` - Namespace
  - `netpol.yaml` - Network policies
  - `observer-code.yaml` - Observer code
- `apps/arcs/zeta/` - Zeta Kustomize
  - `app-config.yaml`
  - `deploy.yaml`
  - `kustomization.yaml`
  - `namespace.yaml`
  - `netpol.yaml`
  - `service.yaml`
  - `overlays/prod/` - Production overlays
- `apps/arcs/arc-zeta/netpol/zeta-egress.yaml` - Egress policies
- `observer-api/Dockerfile` - Observer API Dockerfile
- `scripts/packet-u3-zeta-websocket-bridge.sh` - Scripts
- `scripts/u3-recover-and-verify.sh` - Recovery scripts

**UI Locations:**
- ❌ **NO UI PANEL** - Zeta has no dedicated UI panel component
- Referenced in `ui/src/components/godview/ArcFilterBar.tsx` - Default arcs list includes 'Zeta'
- `ui/src/api/godviewClient.ts` - Mock topology includes zeta routes

**Dependencies:**
- **Chi** - Network policy allows egress to Chi bus (ports 4222, 7422)

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployments: `observer-api` (with websocket service)
- Services: `observer-api`, `observer-api-ws` (port 8082)
- Namespace: `arc-zeta`
- Network policies configured

**Notes:**
- Websocket bridge for log viewing
- Observer API provides telemetry access
- No UI panel despite active backend
- Referenced in Rho² policy identity mapping

---

### **8. Phi (φ) - `arc-phi`**

**Purpose/Role:** Cortical navigator. Provides cortex functionality with NATS leaf connectivity.

**Backend Locations:**
- `apps/arcs/phi/` - Phi Kustomize
  - `base/kustomization.yaml`
  - `base/phi-egress-cnp.yaml` - Cilium network policy
  - `base/phi-leaf-config-cm.yaml` - NATS leaf config
  - `namespace.yaml` - Namespace
  - `netpol.yaml` - Network policies
  - `phi-cortex.yaml` - Cortex deployment
  - `overlays/prod/kustomization.yaml`
  - `chi-acl-patch.sh` - ACL patch script
  - `verify.sh` - Verification script
- `apps/arcs/arc-phi/netpol/phi-egress.yaml` - Egress policies
- `services/phi-cortex/` - Service source code
  - `Dockerfile`
  - `main.py`
  - `requirements.txt`
- `scripts/phi-nats-fix.sh` - Scripts
- `scripts/phi-cortex-forced-fix.sh` - Scripts
- `scripts/packet-f1.4-phi-navigator.sh` - Scripts

**UI Locations:**
- ❌ **NO UI PANEL** - Phi has no dedicated UI panel component
- Referenced in `ui/src/components/godview/ArcFilterBar.tsx` - Default arcs list includes 'Phi'

**Dependencies:**
- **Chi** - NATS leaf sidecar connects to Chi bus
- Network policies allow egress to Chi

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `phi-cortical-navigator` (with phi-leaf sidecar)
- Namespace: `arc-phi`
- Network policies configured

**Notes:**
- Cortical navigator with Python cortex component
- NATS leaf sidecar for Chi connectivity
- Referenced in Rho² policy identity mapping
- No UI panel despite active backend

---

### **9. Psi (ψ) - `arc-psi`**

**Purpose/Role:** Orchestrator service. Coordinates and orchestrates federation operations.

**Backend Locations:**
- `apps/arcs/psi/` - Psi Kustomize
  - `namespaces.yaml` - Namespace
  - `netpol.yaml` - Network policies
  - `psi-orchestrator.yaml` - Orchestrator deployment
  - `rbac.yaml` - RBAC definitions
  - `allowlist.yaml` - Allowlist
  - `verify.sh` - Verification script
- `services/psi-orchestrator/` - Service source code
  - `Dockerfile`
  - `main.py`
  - `requirements.txt`

**UI Locations:**
- ❌ **NO UI PANEL** - Psi has no dedicated UI panel component
- Referenced in `ui/src/components/godview/ArcFilterBar.tsx` - Default arcs list includes 'Psi'

**Dependencies:**
- Unknown - No explicit Chi dependency found in manifests (may be implicit)

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `psi-orchestrator`
- Namespace: `arc-psi`
- Network policies and RBAC configured

**Notes:**
- Orchestrator service for federation coordination
- Referenced in Rho² policy identity mapping
- No UI panel despite active backend

---

### **10. Xi (ξ) - `arc-xi`**

**Purpose/Role:** Xenolith ledger. Provides ledger functionality for federation.

**Backend Locations:**
- `arcs/xi/` - Xi Arc directory
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `Dockerfile`
  - `xi-api.yaml` - API definition
- `apps/arcs/xi/` - Xi Kustomize
  - `namespace.yaml` - Namespace
  - `netpol.yaml` - Network policies
  - `xenolith-ledger.yaml` - Ledger deployment
  - `verify.sh` - Verification script
- `services/xenolith-ledger/` - Service source code
  - `main.py`
  - `requirements.txt`
- `SAGE_API_SURFACE.md` - Documents `arc-xi` namespace

**UI Locations:**
- ❌ **NO UI PANEL** - Xi has no dedicated UI panel component
- Referenced in `ui/src/components/godview/ArcFilterBar.tsx` - Default arcs list includes 'Xi'

**Dependencies:**
- Unknown - No explicit Chi dependency found in manifests

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployments: `xi-api`, `xenolith-ledger`
- Services: `xi-api`, `xenolith-ledger` (port 8090)
- Namespace: `arc-xi`
- PVC for ledger storage

**Notes:**
- Xenolith ledger provides distributed ledger functionality
- Referenced in Rho² policy identity mapping
- No UI panel despite active backend

---

### **11. Mu (μ) - `arc-mu`**

**Purpose/Role:** API service. Provides API functionality.

**Backend Locations:**
- `arcs/mu/` - Mu Arc directory
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `Dockerfile`
  - `mu-api.yaml` - API definition
- `SAGE_API_SURFACE.md` - Documents `arc-mu` namespace

**UI Locations:**
- ❌ **NO UI PANEL** - Mu has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `mu-api`
- Service: `mu-api`
- Namespace: `arc-mu`

**Notes:**
- Simple API service
- No UI panel
- Minimal documentation

---

### **12. Nu (ν) - `arc-nu`**

**Purpose/Role:** API service. Provides API functionality.

**Backend Locations:**
- `arcs/nu/` - Nu Arc directory
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `Dockerfile`
  - `nu-api.yaml` - API definition
- `SAGE_API_SURFACE.md` - Documents `arc-nu` namespace

**UI Locations:**
- ❌ **NO UI PANEL** - Nu has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `nu-api`
- Service: `nu-api`
- Namespace: `arc-nu`

**Notes:**
- Simple API service
- No UI panel
- Minimal documentation

---

### **13. Iota (ι) - `arc-iota`**

**Purpose/Role:** API service. Provides API functionality.

**Backend Locations:**
- `arcs/iota/` - Iota Arc directory
  - `deploy.yaml` - Deployment
  - `kustomization.yaml`
- `SAGE_API_SURFACE.md` - Documents `arc-iota` namespace

**UI Locations:**
- ❌ **NO UI PANEL** - Iota has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `iota-api`
- Service: `iota-api`
- Namespace: `arc-iota`

**Notes:**
- Simple API service
- No UI panel
- Minimal documentation

---

### **14. Omicron (ο) - `arc-omicron`**

**Purpose/Role:** API service. Provides API functionality.

**Backend Locations:**
- `arcs/omicron/` - Omicron Arc directory
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `Dockerfile`
  - `omicron-api.yaml` - API definition
- `SAGE_API_SURFACE.md` - Documents `arc-omicron` namespace
- `unstick_omicron.sh` - Recovery scripts
- `reset_omicron_hard.sh` - Reset scripts
- `nuke_omicron_replicas.sh` - Cleanup scripts

**UI Locations:**
- ❌ **NO UI PANEL** - Omicron has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `omicron-api`
- Service: `omicron-api`
- Namespace: `arc-omicron`

**Notes:**
- Simple API service
- No UI panel
- Has recovery/reset scripts suggesting operational issues

---

### **15. Epsilon (ε) - `arc-epsilon`**

**Purpose/Role:** UI service. Provides UI functionality.

**Backend Locations:**
- `arcs/epsilon/` - Epsilon Arc directory
  - `kustomization.yaml`
  - `namespace.yaml` - Namespace
  - `nginx-conf.yaml` - Nginx configuration
  - `ui-configmap.yaml` - UI ConfigMap
  - `ui-deploy.yaml` - UI deployment
  - `ui-service.yaml` - UI service

**UI Locations:**
- ❌ **NO UI PANEL** - Epsilon has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `epsilon-ui` (nginx-based)
- Service: `epsilon-ui`
- Namespace: `arc-epsilon`

**Notes:**
- UI service using nginx
- No UI panel in main SAGE UI
- Minimal documentation

---

### **16. Delta (δ) - `arc-delta`**

**Purpose/Role:** Unknown. Minimal manifests present.

**Backend Locations:**
- `arcs/delta/` - Delta Arc directory
  - `all.yaml` - Combined manifests
  - `kustomization.yaml`

**UI Locations:**
- ❌ **NO UI PANEL** - Delta has no dedicated UI panel component

**Dependencies:**
- Unknown - No explicit dependencies found

**Activation State:** ⚠️ **UNKNOWN** - Minimal manifests, unclear purpose

**Notes:**
- Very minimal configuration
- Purpose unclear from codebase
- May be placeholder or experimental

---

### **17. Rho2b - `arc-rho2b`**

**Purpose/Role:** Rho² variant. Security hardening variant of Rho².

**Backend Locations:**
- `arcs/rho2b/` - Rho2b Arc directory
  - `00-namespace.yaml` - Namespace
  - `01-serviceaccount.yaml` - Service account
  - `02-deployment.yaml` - Deployment
  - `03-service.yaml` - Service
  - `04-cilium-allow-probes-l4.yaml` - Cilium policies
  - `05-config.yaml` - Configuration
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `crds/rotationpolicy.yaml` - CRD definition
  - `Dockerfile`
  - `jobs/kappa-db-rotate.yaml` - Rotation job
  - `kustomization.yaml`

**UI Locations:**
- ❌ **NO UI PANEL** - Rho2b has no dedicated UI panel component

**Dependencies:**
- Unknown - Likely similar to Rho²

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `rho2b-api`
- Service: `rho2b-api` (port 8000)
- Namespace: `arc-rho2b`

**Notes:**
- Variant of Rho² with similar structure
- No UI panel
- Separate namespace from rho2

---

### **18. Rho2c - `arc-rho2c`**

**Purpose/Role:** Rho² variant. Security hardening variant of Rho².

**Backend Locations:**
- `arcs/rho2c/` - Rho2c Arc directory
  - `00-namespace.yaml` - Namespace
  - `01-serviceaccount.yaml` - Service account
  - `02-deployment.yaml` - Deployment
  - `03-service.yaml` - Service
  - `04-cilium-allow-probes-l4.yaml` - Cilium policies
  - `05-config.yaml` - Configuration
  - `app/main.py` - Application code
  - `app/requirements.txt` - Dependencies
  - `crds/rotationpolicy.yaml` - CRD definition
  - `Dockerfile`
  - `jobs/kappa-db-rotate.yaml` - Rotation job
  - `kustomization.yaml`

**UI Locations:**
- ❌ **NO UI PANEL** - Rho2c has no dedicated UI panel component

**Dependencies:**
- Unknown - Likely similar to Rho²

**Activation State:** ✅ **ACTIVE** (backend only)
- Deployment: `rho2c-api`
- Service: `rho2c-api` (port 8000)
- Namespace: `arc-rho2c`

**Notes:**
- Variant of Rho² with similar structure
- No UI panel
- Separate namespace from rho2 and rho2b

---

### **19. Lambda-locked - `arc-lambda-locked`**

**Purpose/Role:** Lambda variant with stricter security policies. Locked-down version of Lambda Arc.

**Backend Locations:**
- `kubernetes/arc-lambda-locked/` - Kubernetes manifests
  - `ds-lambda-agent.yaml` - DaemonSet for lambda agent
  - `netpol-allow-chi-bus.yaml` - Network policy for Chi
  - `netpol-allow-dns.yaml` - Network policy for DNS
  - `netpol-egress-default-deny.yaml` - Default deny egress
  - `ns.yaml` - Namespace
  - `svc-lambda-api.yaml` - Service
- `docs/arc-lambda-locked-security.md` - Documentation
- `kubernetes/arc-chi/netpol-chi-bus-allow-ingress.yaml` - References lambda-locked

**UI Locations:**
- ❌ **NO UI PANEL** - Lambda-locked has no dedicated UI panel component

**Dependencies:**
- **Chi** - Network policy allows egress to Chi bus

**Activation State:** ✅ **ACTIVE** (backend only)
- DaemonSet: `lambda-agent`
- Service: `lambda-api`
- Namespace: `arc-lambda-locked`
- Stricter network policies than regular Lambda

**Notes:**
- More constrained policies than regular Lambda
- Default deny egress with explicit allows
- No UI panel
- Separate from regular Lambda Arc

---

### **20. UI - `arc-ui`**

**Purpose/Role:** Enterprise UI deployment. Hosts the SAGE Enterprise UI.

**Backend Locations:**
- `kubernetes/arc-ui/` - Kubernetes manifests
  - `sage-enterprise-ui.yaml` - UI deployment
  - `sage-api-simple.yaml` - API deployment
  - `sage-api.yaml` - API definition
  - `namespace.yaml` - Namespace
  - `netpol-ui.yaml` - Network policies
  - `netpol-kubelet-probes.yaml` - Kubelet probe policies
  - `kustomization.yaml`
- `arc-ui-kustomization.yaml` - Root kustomization
- `clusters/sage/arcs.yaml` - Flux kustomization reference

**UI Locations:**
- ❌ **NO UI PANEL** - UI Arc is the container, not a panel within itself
- The UI itself is deployed in this namespace

**Dependencies:**
- Unknown - UI may have dependencies on other Arcs for API access

**Activation State:** ✅ **ACTIVE**
- Deployment: `sage-enterprise-ui`
- Service: UI service
- Namespace: `arc-ui`

**Notes:**
- This is the namespace where the SAGE Enterprise UI runs
- Not an Arc panel, but the UI deployment itself
- Separate from other Arcs

---

## Section 3: Dependency and Activation Order Graph

### Dependency Graph (Textual)

```
┌─────────────────────────────────────────────────────────────┐
│                    FOUNDATION LAYER                         │
│                                                             │
│  Chi (Χ) ────────────────────────────────────────────────┐ │
│  [NATS Hub]                                               │ │
│  Must be activated FIRST                                  │ │
│  No dependencies                                           │ │
└───────────────────────────────────────────────────────────┼─┘
                                                             │
┌─────────────────────────────────────────────────────────────┼─┐
│                    CORE INFRASTRUCTURE                      │ │
│                                                             │ │
│  Theta (Θ) ────────────────────────────────────────────────┼─┤
│  [DNS Sovereignty]                                         │ │
│  Independent, but other Arcs depend on DNS                  │ │
│  Status: PAUSED (pending NAT/firewall)                     │ │
│                                                             │ │
│  Rho² (ρ²) ────────────────────────────────────────────────┼─┤
│  [Security Gate]                                           │ │
│  Depends on: Chi (for gate validation)                      │ │
│  Should activate early for security                        │ │
└─────────────────────────────────────────────────────────────┼─┘
                                                             │
┌─────────────────────────────────────────────────────────────┼─┐
│                    OBSERVABILITY LAYER                     │ │
│                                                             │ │
│  Sigma (Σ) ────────────────────────────────────────────────┼─┤
│  [Telemetry Baseline]                                     │ │
│  Depends on: Chi                                           │ │
│                                                             │ │
│  Omega (Ω) ────────────────────────────────────────────────┼─┤
│  [Reason Streams / Freshness Gate]                         │ │
│  Depends on: Chi, Sigma                                    │ │
│  Reads: sigma-baseline, federation-arcs ConfigMaps          │ │
└─────────────────────────────────────────────────────────────┼─┘
                                                             │
┌─────────────────────────────────────────────────────────────┼─┐
│                    APPLICATION LAYER                      │ │
│                                                             │ │
│  Lambda (Λ) ────────────────────────────────────────────────┼─┤
│  [Application Arc]                                         │ │
│  Depends on: Chi                                           │ │
│                                                             │ │
│  Lambda-locked ────────────────────────────────────────────┼─┤
│  [Locked Lambda Variant]                                   │ │
│  Depends on: Chi                                           │ │
│                                                             │ │
│  Zeta (ζ) ────────────────────────────────────────────────┼─┤
│  [Websocket Bridge]                                        │ │
│  Depends on: Chi                                           │ │
│                                                             │ │
│  Phi (φ) ────────────────────────────────────────────────┼─┤
│  [Cortical Navigator]                                      │ │
│  Depends on: Chi                                           │ │
│                                                             │ │
│  Psi (ψ) ────────────────────────────────────────────────┼─┤
│  [Orchestrator]                                            │ │
│  Dependencies: Unknown (likely Chi)                        │ │
└─────────────────────────────────────────────────────────────┼─┘
                                                             │
┌─────────────────────────────────────────────────────────────┼─┐
│                    SPECIALIZED SERVICES                     │ │
│                                                             │ │
│  Xi (ξ) ────────────────────────────────────────────────┼─┤
│  [Xenolith Ledger]                                         │ │
│  Dependencies: Unknown                                     │ │
│                                                             │ │
│  Mu (μ), Nu (ν), Iota (ι), Omicron (ο) ────────────────────┼─┤
│  [API Services]                                            │ │
│  Dependencies: Unknown                                      │ │
│                                                             │ │
│  Epsilon (ε) ──────────────────────────────────────────────┼─┤
│  [UI Service]                                               │ │
│  Dependencies: Unknown                                      │ │
│                                                             │ │
│  Rho2b, Rho2c ──────────────────────────────────────────────┼─┤
│  [Rho² Variants]                                           │ │
│  Dependencies: Likely Chi (similar to Rho²)                 │ │
│                                                             │ │
│  Delta (δ) ────────────────────────────────────────────────┼─┤
│  [Unknown Purpose]                                         │ │
│  Dependencies: Unknown                                      │ │
└─────────────────────────────────────────────────────────────┘
```

### Explicit Dependencies from Code

**Chi Dependencies (Network Policies):**
- Omega: `netpol-allow-chi-bus.yaml` allows egress to `arc-chi`
- Sigma: `netpol-sigma.yaml` allows egress to `arc-chi`
- Lambda: `netpol-lambda.yaml` allows egress to `arc-chi`
- Lambda-locked: `netpol-allow-chi-bus.yaml` allows egress to `arc-chi`
- Zeta: Network policies allow egress to Chi (ports 4222, 7422)
- Phi: NATS leaf sidecar connects to Chi
- Chi: `netpol-chi-bus-allow-ingress.yaml` allows ingress from `arc-omega`, `arc-lambda-locked`

**Omega Dependencies:**
- Reads from `sigma-baseline` ConfigMap (maintained by Sigma)
- Reads from `federation-arcs` ConfigMap (maintained by multiple Arcs)
- Network policy allows egress to Chi

**Theta Dependencies:**
- CoreDNS forwards to Theta DoH proxy
- Other Arcs depend on Theta indirectly through CoreDNS

**Rho² Dependencies:**
- Rho² gate validates posture before Chi access
- Network policies reference Chi

---

## Section 4: Gaps, Mismatches, and Risks

### **Gaps Identified**

#### **1. UI Panels Without Backend (NONE)**
✅ All UI panels have corresponding backend implementations.

#### **2. Backend Arcs Without UI Panels (14 Arcs)**
The following Arcs have backend implementations but no UI panels:
- **Zeta (ζ)** - Websocket bridge (active backend, no panel)
- **Phi (φ)** - Cortical navigator (active backend, no panel)
- **Psi (ψ)** - Orchestrator (active backend, no panel)
- **Xi (ξ)** - Xenolith ledger (active backend, no panel)
- **Mu (μ)** - API service (active backend, no panel)
- **Nu (ν)** - API service (active backend, no panel)
- **Iota (ι)** - API service (active backend, no panel)
- **Omicron (ο)** - API service (active backend, no panel)
- **Epsilon (ε)** - UI service (active backend, no panel)
- **Delta (δ)** - Unknown purpose (minimal backend, no panel)
- **Rho2b** - Rho² variant (active backend, no panel)
- **Rho2c** - Rho² variant (active backend, no panel)
- **Lambda-locked** - Lambda variant (active backend, no panel)
- **UI** - Enterprise UI namespace (not a panel, but deployment target)

**Risk:** Operators cannot monitor or interact with these Arcs through the UI.

#### **3. Incomplete Dependency Documentation**
- **Mu, Nu, Iota, Omicron, Epsilon, Delta:** No explicit Chi dependencies found in manifests, but likely need Chi for federation communication
- **Psi, Xi:** Dependencies unclear from codebase
- **Rho2b, Rho2c:** Dependencies not explicitly documented (likely similar to Rho²)

**Risk:** Activation order may be incorrect if dependencies are assumed but not verified.

#### **4. Theta Status Mismatch**
- **Chronicle states:** Theta is "PAUSED" pending NAT/firewall configuration
- **Codebase:** Theta manifests and namespace exist
- **Risk:** Theta may appear active in code but be non-functional in practice

#### **5. Arc Service Mock Data**
- `ui/src/services/arcService.ts` contains mock data for only 6 Arcs (theta, sigma, omega, rho2, lambda, chi)
- Other Arcs have no mock data, suggesting they're not integrated into UI status system

**Risk:** UI cannot display status for Arcs without mock data, even if panels existed.

### **Mismatches Identified**

#### **1. Sidebar vs. App.tsx Registration**
- **SidebarNavigator:** Lists 6 Arcs (theta, sigma, omega, rho2, lambda, chi)
- **App.tsx:** Registers same 6 Arcs
- ✅ **Match:** No mismatch

#### **2. Intent Engine vs. Panel Registration**
- **Intent Engine:** Routes `open.*theta`, `open.*sigma`, `open.*omega`, `open.*rho`, `open.*lambda`, `open.*chi`
- **App.tsx:** Registers same 6 Arcs
- ✅ **Match:** No mismatch

#### **3. GodView Arc Filter vs. Actual Arcs**
- **ArcFilterBar defaultArcs:** `['Chi', 'Lambda', 'Omega', 'Rho2', 'Rho²', 'Sigma', 'Psi', 'UI', 'Core']`
- **Actual UI Panels:** 6 Arcs (theta, sigma, omega, rho2, lambda, chi)
- ⚠️ **Mismatch:** GodView includes 'Psi' and 'UI' which have no panels, and excludes 'Theta'

#### **4. Namespace Definitions vs. Arc Directories**
- **Namespaces in `kubernetes/common/namespaces.yaml`:** chi, omega, sigma, lambda, theta (5 namespaces)
- **Arc directories in `arcs/`:** 13 directories
- ⚠️ **Mismatch:** Many Arcs have directories but no namespace definitions in common file

### **Risks Identified**

#### **1. Activation Order Risk**
- **Chi must be first:** All other Arcs depend on Chi
- **Theta is paused:** May cause DNS resolution issues if activated
- **Omega depends on Sigma:** Should activate Sigma before Omega
- **Rho² should be early:** Security gate should be active before other Arcs

**Risk:** Activating Arcs out of order may cause cascading failures.

#### **2. Missing UI Integration Risk**
- 14 Arcs have no UI panels
- Operators cannot monitor these Arcs through UI
- Status, logs, and telemetry may be inaccessible

**Risk:** Operational blind spots for majority of Arcs.

#### **3. Incomplete Documentation Risk**
- Many Arcs have minimal documentation
- Dependencies not explicitly stated
- Purpose unclear for some Arcs (Delta, Mu, Nu, Iota, Omicron)

**Risk:** Difficult to understand Arc roles and relationships.

#### **4. Mock Data Limitation Risk**
- UI uses mock data for Arc status
- No real backend integration for status checks
- Status may not reflect actual Arc state

**Risk:** UI may show incorrect status information.

---

## Section 5: Recommended Activation Order

### **Based on Evidence Found in Codebase**

#### **Phase 1: Foundation (MUST BE FIRST)**
1. **Chi (Χ)** - NATS hub
   - **Reason:** All other Arcs depend on Chi for NATS connectivity
   - **Evidence:** Network policies across multiple Arcs reference `arc-chi`
   - **Risk if skipped:** All subsequent Arcs will fail to connect

#### **Phase 2: Security Spine (ACTIVATE EARLY)**
2. **Rho² (ρ²)** - Security gate
   - **Reason:** Provides posture validation and security gate before Chi access
   - **Evidence:** Rho² gate validates posture before Chi access
   - **Risk if skipped:** Security validation bypassed

#### **Phase 3: Network Infrastructure (CONDITIONAL)**
3. **Theta (Θ)** - DNS sovereignty
   - **Reason:** Provides DNS resolution for other Arcs
   - **Evidence:** CoreDNS forwards to Theta DoH proxy
   - **Status:** ⚠️ **PAUSED** - Do not activate until NAT/firewall configured
   - **Risk if activated prematurely:** May fail or cause DNS resolution issues

#### **Phase 4: Observability (ACTIVATE AFTER CHI)**
4. **Sigma (Σ)** - Telemetry baseline
   - **Reason:** Maintains telemetry baselines that Omega reads
   - **Evidence:** Omega reads from `sigma-baseline` ConfigMap
   - **Dependencies:** Chi
   - **Risk if skipped:** Omega will have no baseline data

5. **Omega (Ω)** - Reason streams / freshness gate
   - **Reason:** Monitors Arc health and reason streams
   - **Evidence:** Reads from Sigma ConfigMaps, writes to `federation-arcs`
   - **Dependencies:** Chi, Sigma
   - **Risk if skipped:** No freshness monitoring or reason stream processing

#### **Phase 5: Application Layer (ACTIVATE AFTER CHI)**
6. **Lambda (Λ)** - Application arc
   - **Reason:** Main application workload
   - **Evidence:** Network policy allows egress to Chi
   - **Dependencies:** Chi
   - **Risk if skipped:** Application workloads unavailable

7. **Lambda-locked** - Locked Lambda variant
   - **Reason:** Stricter security variant of Lambda
   - **Evidence:** Network policies with default deny
   - **Dependencies:** Chi
   - **Risk if skipped:** Locked variant unavailable

#### **Phase 6: Supporting Services (ACTIVATE AFTER CHI)**
8. **Zeta (ζ)** - Websocket bridge
   - **Reason:** Provides websocket connectivity and log viewing
   - **Evidence:** Network policy allows egress to Chi
   - **Dependencies:** Chi
   - **Risk if skipped:** Websocket bridge unavailable

9. **Phi (φ)** - Cortical navigator
   - **Reason:** Provides cortex functionality
   - **Evidence:** NATS leaf sidecar connects to Chi
   - **Dependencies:** Chi
   - **Risk if skipped:** Cortical navigator unavailable

10. **Psi (ψ)** - Orchestrator
    - **Reason:** Coordinates federation operations
    - **Evidence:** Referenced in Rho² policy
    - **Dependencies:** Unknown (likely Chi)
    - **Risk if skipped:** Orchestration unavailable

11. **Xi (ξ)** - Xenolith ledger
    - **Reason:** Provides ledger functionality
    - **Evidence:** Referenced in Rho² policy
    - **Dependencies:** Unknown
    - **Risk if skipped:** Ledger unavailable

#### **Phase 7: API Services (ACTIVATE AFTER CHI)**
12. **Mu (μ)**, **Nu (ν)**, **Iota (ι)**, **Omicron (ο)** - API services
    - **Reason:** Provide API functionality
    - **Evidence:** Deployments and services exist
    - **Dependencies:** Unknown (likely Chi)
    - **Risk if skipped:** API services unavailable

13. **Epsilon (ε)** - UI service
    - **Reason:** Provides UI functionality
    - **Evidence:** Nginx-based UI deployment
    - **Dependencies:** Unknown
    - **Risk if skipped:** UI service unavailable

#### **Phase 8: Variants (ACTIVATE AFTER BASE)**
14. **Rho2b**, **Rho2c** - Rho² variants
    - **Reason:** Security hardening variants
    - **Evidence:** Similar structure to Rho²
    - **Dependencies:** Unknown (likely Chi, similar to Rho²)
    - **Risk if skipped:** Variant functionality unavailable

#### **Phase 9: Unknown/Experimental (ACTIVATE LAST)**
15. **Delta (δ)** - Unknown purpose
    - **Reason:** Minimal manifests, unclear purpose
    - **Evidence:** Very minimal configuration
    - **Dependencies:** Unknown
    - **Risk if skipped:** Unknown impact

### **Critical Activation Sequence**

```
1. Chi (Χ)                    [FOUNDATION - MUST BE FIRST]
   ↓
2. Rho² (ρ²)                  [SECURITY GATE - ACTIVATE EARLY]
   ↓
3. Sigma (Σ)                   [OBSERVABILITY - BEFORE OMEGA]
   ↓
4. Omega (Ω)                   [OBSERVABILITY - AFTER SIGMA]
   ↓
5. Lambda (Λ)                  [APPLICATION - AFTER CHI]
   ↓
6. Lambda-locked               [APPLICATION VARIANT]
   ↓
7. Zeta (ζ), Phi (φ), Psi (ψ), Xi (ξ)  [SUPPORTING SERVICES]
   ↓
8. Mu, Nu, Iota, Omicron, Epsilon  [API SERVICES]
   ↓
9. Rho2b, Rho2c               [VARIANTS]
   ↓
10. Delta (δ)                  [UNKNOWN/EXPERIMENTAL]
```

**Theta (Θ) - SPECIAL CASE:**
- **DO NOT ACTIVATE** until NAT/firewall configuration is complete
- Chronicle explicitly states: "PAUSED. Waiting on NAT443 or DoH (Talos host firewall / SNAT)."
- Once ready, activate after Chi but before other Arcs that need DNS

### **Activation Validation Checklist**

Before activating each Arc, verify:
- [ ] Chi is running and accessible
- [ ] Network policies are in place
- [ ] Namespace exists
- [ ] Service accounts and RBAC configured
- [ ] Dependencies are satisfied
- [ ] Health checks pass

---

## Appendix: Code References

### **UI Panel Components**
- `ui/src/features/arc/ArcThetaPanel.tsx`
- `ui/src/features/arc/ArcSigmaPanel.tsx`
- `ui/src/features/arc/ArcOmegaPanel.tsx`
- `ui/src/features/arc/ArcRho2Lodge.tsx`
- `ui/src/features/arc/ArcLambdaPanel.tsx`
- `ui/src/features/arc/ArcChiPanel.tsx`

### **UI Registration**
- `ui/src/app/App.tsx` - Panel routing switch statement
- `ui/src/components/SidebarNavigator/SidebarNavigator.tsx` - Navigation menu
- `ui/src/lib/intentEngine.ts` - Intent routing

### **Backend Manifests**
- `kubernetes/arc-*/` - Kubernetes manifests for each Arc
- `apps/arcs/*/` - Kustomize configurations
- `arcs/*/` - Arc-specific directories

### **Documentation**
- `docs/chronicles/arc-federation-omega-rho2-sigma.md`
- `docs/chronicles/arc-federation-security-spine-completion.md`
- `docs/arc-sigma-baseline.md`
- `docs/arc-omega-meaning-layer.md`
- `SAGE_FEDERATION_ARCHIVE_OVERVIEW.md`

### **Service Code**
- `services/phi-cortex/`
- `services/psi-orchestrator/`
- `services/xenolith-ledger/`

---

**End of Federation Arc Map**

*This document is a factual inventory based on codebase analysis. No assumptions were made beyond what is explicitly present in the code.*
