# SAGE Federation Arc Inventory

**Generated:** 2026-01-25  
**Repository:** sage-gitops  
**Analysis Type:** READ-ONLY Inventory

---

## Summary

This inventory lists all SAGE Federation Arcs that currently exist in the repository, their locations, namespaces, resource status, and any missing pieces.

---

## Arc Inventory

### 1. **ARC Χ — Chi**

**Symbol:** Χ (Chi)  
**Status:** ⚠️ **PARTIALLY WIRED** (Base only, no deployment)

**Directory Paths:**
- `apps/arcs/chi/base/` - Kustomize base
- `kubernetes/arc-chi/` - Legacy Kubernetes manifests

**Namespace:**
- `arc-chi` (defined in `kubernetes/common/namespaces.yaml`)

**Resources Present:**
- ✅ Namespace: `arc-chi` (in `kubernetes/common/namespaces.yaml`)
- ✅ CiliumNetworkPolicy: `chi-ingress` (in `apps/arcs/chi/base/chi-ingress-cnp.yaml`)
- ✅ Kustomization: `apps/arcs/chi/base/kustomization.yaml`
- ✅ Legacy manifests in `kubernetes/arc-chi/` (NATS config, RBAC, network policies)

**Missing Pieces:**
- ❌ No Deployment manifest (Chi is NATS hub, may be deployed elsewhere)
- ❌ No Service manifest (referenced as `chi-bus.arc-chi.svc.cluster.local` but not defined in apps/arcs)
- ⚠️ Base kustomization only includes CNP, no app resources

**Notes:**
- Chi is the foundational dependency for all other Arcs
- Referenced by network policies across multiple Arcs
- Currently included in `apps/arcs/kustomization.yaml` (only Chi base)

---

### 2. **ARC Φ — Phi**

**Symbol:** Φ (Phi)  
**Status:** ⚠️ **PARTIALLY WIRED** (Base + overlay, but not in root kustomization)

**Directory Paths:**
- `apps/arcs/phi/base/` - Kustomize base
- `apps/arcs/phi/overlays/prod/` - Production overlay
- `apps/arcs/phi/` - Additional manifests
- `apps/arcs/arc-phi/netpol/` - Live dump (should be removed)

**Namespace:**
- `arc-phi` (defined in `apps/arcs/phi/namespace.yaml`)

**Resources Present:**
- ✅ Namespace: `apps/arcs/phi/namespace.yaml`
- ✅ Kustomization base: `apps/arcs/phi/base/kustomization.yaml`
- ✅ Kustomization overlay: `apps/arcs/phi/overlays/prod/kustomization.yaml`
- ✅ CiliumNetworkPolicy: `phi-egress-cnp.yaml`
- ✅ ConfigMap: `phi-leaf-config-cm.yaml`
- ✅ Deployment: `phi-cortex.yaml` (phi deployment)
- ✅ NetworkPolicy: `netpol.yaml`

**Missing Pieces:**
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Overlay references `../../../_base` but `apps/arcs/_base/` has no kustomization.yaml (only `_base/app/` does)
- ⚠️ Live dump in `apps/arcs/arc-phi/netpol/phi-egress.yaml` (should be removed)

**Notes:**
- Has complete base + overlay structure
- Overlay path issue needs fixing before activation

---

### 3. **ARC Λ — Lambda**

**Symbol:** Λ (Lambda)  
**Status:** ⚠️ **PARTIALLY WIRED** (Overlay only, references broken base path)

**Directory Paths:**
- `apps/arcs/lambda/overlays/prod/` - Production overlay
- `apps/arcs/arc-lambda/netpol/` - Live dump (should be removed)
- `arcs/lambda/` - Legacy manifests
- `kubernetes/arc-lambda/` - Legacy Kubernetes manifests

**Namespace:**
- `arc-lambda` (defined in `kubernetes/common/namespaces.yaml`)

**Resources Present:**
- ✅ Namespace: `arc-lambda` (in `kubernetes/common/namespaces.yaml`)
- ✅ Kustomization overlay: `apps/arcs/lambda/overlays/prod/kustomization.yaml`
- ✅ Legacy manifests in `arcs/lambda/` and `kubernetes/arc-lambda/`

**Missing Pieces:**
- ❌ No base kustomization (overlay references `../../../_base` which doesn't have kustomization.yaml)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Overlay path issue: references `../../../_base` but should reference `../../../_base/app`
- ⚠️ Live dump in `apps/arcs/arc-lambda/netpol/lambda-egress.yaml` (should be removed)

**Notes:**
- Overlay structure exists but base path is broken
- Uses `_base/app` pattern like Phi, UI, Zeta

---

### 4. **ARC Ζ — Zeta**

**Symbol:** Ζ (Zeta)  
**Status:** ⚠️ **PARTIALLY WIRED** (Complete structure, but not in root kustomization)

**Directory Paths:**
- `apps/arcs/zeta/` - Root kustomization
- `apps/arcs/zeta/overlays/prod/` - Production overlay
- `apps/arcs/arc-zeta/netpol/` - Live dump (should be removed)
- `arcs/zeta/` - Legacy manifests

**Namespace:**
- `arc-zeta` (defined in `apps/arcs/zeta/namespace.yaml`)

**Resources Present:**
- ✅ Namespace: `apps/arcs/zeta/namespace.yaml`
- ✅ Kustomization root: `apps/arcs/zeta/kustomization.yaml`
- ✅ Kustomization overlay: `apps/arcs/zeta/overlays/prod/kustomization.yaml`
- ✅ Deployment: `apps/arcs/zeta/deploy.yaml`
- ✅ Service: `apps/arcs/zeta/service.yaml` and `overlays/prod/service.yaml`
- ✅ ConfigMap: `apps/arcs/zeta/app-config.yaml`
- ✅ NetworkPolicy: `apps/arcs/zeta/netpol.yaml`

**Missing Pieces:**
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Overlay references `../../../_base` but `apps/arcs/_base/` has no kustomization.yaml
- ⚠️ Live dump in `apps/arcs/arc-zeta/netpol/zeta-egress.yaml` (should be removed)

**Notes:**
- Most complete Arc structure
- Has root kustomization + overlay pattern
- Overlay path issue needs fixing

---

### 5. **ARC Ω — Omega**

**Symbol:** Ω (Omega)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but no kustomization structure)

**Directory Paths:**
- `apps/arcs/omega/` - Quarantine dumper
- `apps/arcs/omega-monitor/` - Application code
- `apps/arcs/omega-reason-stream/` - Application code
- `apps/arcs/arc-omega/netpol/` - Live dump (should be removed)
- `kubernetes/arc-omega/` - Legacy Kubernetes manifests

**Namespace:**
- `arc-omega` (defined in `kubernetes/common/namespaces.yaml`)

**Resources Present:**
- ✅ Namespace: `arc-omega` (in `kubernetes/common/namespaces.yaml`)
- ✅ Legacy manifests in `kubernetes/arc-omega/` (deployments, services, configmaps, network policies)
- ✅ Application code directories

**Missing Pieces:**
- ❌ No kustomization.yaml in `apps/arcs/omega/`
- ❌ No kustomization structure (base/overlay)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Live dump in `apps/arcs/arc-omega/netpol/omega-egress.yaml` (should be removed)

**Notes:**
- Has extensive legacy manifests in `kubernetes/arc-omega/`
- Needs kustomization structure created

---

### 6. **ARC Σ — Sigma**

**Symbol:** Σ (Sigma)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but no kustomization structure)

**Directory Paths:**
- `apps/arcs/sigma-agent/` - Application code
- `apps/arcs/arc-sigma/netpol/` - Live dump (should be removed)
- `kubernetes/arc-sigma/` - Legacy Kubernetes manifests

**Namespace:**
- `arc-sigma` (defined in `kubernetes/common/namespaces.yaml`)

**Resources Present:**
- ✅ Namespace: `arc-sigma` (in `kubernetes/common/namespaces.yaml`)
- ✅ Legacy manifests in `kubernetes/arc-sigma/` (deployment, network policy)
- ✅ Application code directory

**Missing Pieces:**
- ❌ No kustomization.yaml in `apps/arcs/sigma/` (directory doesn't exist)
- ❌ No kustomization structure
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Live dump in `apps/arcs/arc-sigma/netpol/sigma-egress.yaml` (should be removed)

**Notes:**
- Minimal structure
- Needs kustomization structure created

---

### 7. **ARC Ρ² — Rho2**

**Symbol:** ρ² (Rho2)  
**Status:** ⚠️ **PARTIALLY WIRED** (Base exists, but not in root kustomization)

**Directory Paths:**
- `apps/arcs/rho2/base/` - Kustomize base
- `arcs/rho2/` - Legacy manifests
- `arcs/rho2b/` - Variant B
- `arcs/rho2c/` - Variant C

**Namespace:**
- `arc-rho2` (defined in `apps/arcs/rho2/base/rho2-namespace-rbac.yaml`)

**Resources Present:**
- ✅ Namespace: `apps/arcs/rho2/base/rho2-namespace-rbac.yaml`
- ✅ Kustomization base files: Multiple YAML files in `base/`
- ✅ Deployment: `rho2-gate.yaml`
- ✅ NetworkPolicy: `rho2-netpol.yaml`
- ✅ ConfigMap: `rho2-policy.yaml`
- ✅ ServiceAccount, RBAC: `rho2-namespace-rbac.yaml`
- ✅ CRD: `RotationPolicy` (in `arcs/rho2/crds/rotationpolicy.yaml`)

**Missing Pieces:**
- ❌ No kustomization.yaml in `apps/arcs/rho2/base/` (individual YAML files only)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ CRD needs to be applied before dependent resources

**Notes:**
- Has base resources but no aggregation kustomization
- CRD dependency must be handled

---

### 8. **ARC Ξ — Xi**

**Symbol:** Ξ (Xi)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but no kustomization structure)

**Directory Paths:**
- `apps/arcs/xi/` - Main manifests
- `arcs/xi/` - Legacy manifests

**Namespace:**
- `arc-xi` (defined in `apps/arcs/xi/namespace.yaml` and `arcs/xi/xi-api.yaml`)

**Resources Present:**
- ✅ Namespace: `apps/arcs/xi/namespace.yaml`
- ✅ Deployment: `apps/arcs/xi/xenolith-ledger.yaml`
- ✅ Service: `apps/arcs/xi/xenolith-ledger.yaml`
- ✅ ConfigMap: `apps/arcs/xi/xenolith-ledger.yaml` (xi-policy)
- ✅ ServiceAccount: `apps/arcs/xi/xenolith-ledger.yaml`
- ✅ NetworkPolicy: `apps/arcs/xi/netpol.yaml`
- ✅ Legacy manifests in `arcs/xi/`

**Missing Pieces:**
- ❌ No kustomization.yaml in `apps/arcs/xi/`
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- Has complete resource set but no kustomization aggregation
- All resources in single file `xenolith-ledger.yaml`

---

### 9. **ARC Ψ — Psi**

**Symbol:** Ψ (Psi)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but no kustomization structure)

**Directory Paths:**
- `apps/arcs/psi/` - All manifests

**Namespace:**
- `arc-psi` (defined in `apps/arcs/psi/namespaces.yaml`)
- `arc-sandbox` (also defined in `apps/arcs/psi/namespaces.yaml`)

**Resources Present:**
- ✅ Namespaces: `apps/arcs/psi/namespaces.yaml` (arc-psi, arc-sandbox)
- ✅ Deployment: `apps/arcs/psi/psi-orchestrator.yaml`
- ✅ ConfigMap: `apps/arcs/psi/allowlist.yaml`
- ✅ NetworkPolicy: `apps/arcs/psi/netpol.yaml`
- ✅ RBAC: `apps/arcs/psi/rbac.yaml` (ServiceAccounts, Roles, RoleBindings)

**Missing Pieces:**
- ❌ No kustomization.yaml in `apps/arcs/psi/`
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- Has complete resource set but no kustomization aggregation
- Manages two namespaces (psi and sandbox)

---

### 10. **ARC UI — UI**

**Symbol:** UI  
**Status:** ⚠️ **PARTIALLY WIRED** (Overlay exists, but not in root kustomization)

**Directory Paths:**
- `apps/arcs/ui/overlays/prod/` - Production overlay
- `kubernetes/arc-ui/` - Legacy Kubernetes manifests

**Namespace:**
- `arc-ui` (defined in `kubernetes/arc-ui/namespace.yaml`)

**Resources Present:**
- ✅ Namespace: `kubernetes/arc-ui/namespace.yaml`
- ✅ Kustomization overlay: `apps/arcs/ui/overlays/prod/kustomization.yaml`
- ✅ Service: `apps/arcs/ui/overlays/prod/service.yaml`
- ✅ Legacy manifests in `kubernetes/arc-ui/`

**Missing Pieces:**
- ❌ No base kustomization (overlay references `../../../_base` which doesn't have kustomization.yaml)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Overlay path issue: references `../../../_base` but should reference `../../../_base/app`

**Notes:**
- Uses same overlay pattern as Lambda, Phi, Zeta
- Has separate Flux kustomization pointing to `kubernetes/arc-ui/`

---

### 11. **ARC Ε — Epsilon**

**Symbol:** Ε (Epsilon)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but not in apps/arcs)

**Directory Paths:**
- `arcs/epsilon/` - All manifests

**Namespace:**
- `arc-epsilon` (defined in `arcs/epsilon/namespace.yaml`)

**Resources Present:**
- ✅ Namespace: `arcs/epsilon/namespace.yaml`
- ✅ Kustomization: `arcs/epsilon/kustomization.yaml`
- ✅ Deployment: `arcs/epsilon/ui-deploy.yaml`
- ✅ Service: `arcs/epsilon/ui-service.yaml`
- ✅ ConfigMap: `arcs/epsilon/ui-configmap.yaml`, `nginx-conf.yaml`

**Missing Pieces:**
- ❌ Not in `apps/arcs/` directory (lives in `arcs/epsilon/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Separate location from other Arcs

**Notes:**
- Complete kustomization structure exists
- Located in `arcs/` not `apps/arcs/`

---

### 12. **ARC Ι — Iota**

**Symbol:** Ι (Iota)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but not in apps/arcs)

**Directory Paths:**
- `arcs/iota/` - All manifests

**Namespace:**
- `arc-iota` (defined in `arcs/iota/deploy.yaml`)

**Resources Present:**
- ✅ Namespace: `arcs/iota/deploy.yaml`
- ✅ Kustomization: `arcs/iota/kustomization.yaml`
- ✅ Deployment: `arcs/iota/deploy.yaml` (includes namespace, serviceaccount, deployment)

**Missing Pieces:**
- ❌ Not in `apps/arcs/` directory (lives in `arcs/iota/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)
- ⚠️ Separate location from other Arcs

**Notes:**
- Minimal structure
- Located in `arcs/` not `apps/arcs/`

---

### 13. **ARC Μ — Mu**

**Symbol:** Μ (Mu)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but not in apps/arcs)

**Directory Paths:**
- `arcs/mu/` - All manifests

**Namespace:**
- `arc-mu` (defined in `arcs/mu/mu-api.yaml`)

**Resources Present:**
- ✅ Namespace: `arcs/mu/mu-api.yaml`
- ✅ Deployment: `arcs/mu/mu-api.yaml` (includes namespace, serviceaccount, deployment, service)
- ✅ Application code: `arcs/mu/app/`

**Missing Pieces:**
- ❌ No kustomization.yaml
- ❌ Not in `apps/arcs/` directory (lives in `arcs/mu/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- All resources in single file `mu-api.yaml`
- Located in `arcs/` not `apps/arcs/`

---

### 14. **ARC Ν — Nu**

**Symbol:** Ν (Nu)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but not in apps/arcs)

**Directory Paths:**
- `arcs/nu/` - All manifests

**Namespace:**
- `arc-nu` (defined in `arcs/nu/nu-api.yaml`)

**Resources Present:**
- ✅ Namespace: `arcs/nu/nu-api.yaml`
- ✅ Deployment: `arcs/nu/nu-api.yaml` (includes namespace, serviceaccount, deployment, service)
- ✅ Application code: `arcs/nu/app/`

**Missing Pieces:**
- ❌ No kustomization.yaml
- ❌ Not in `apps/arcs/` directory (lives in `arcs/nu/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- All resources in single file `nu-api.yaml`
- Located in `arcs/` not `apps/arcs/`

---

### 15. **ARC Ο — Omicron**

**Symbol:** Ο (Omicron)  
**Status:** ⚠️ **INACTIVE** (Manifests exist but not in apps/arcs)

**Directory Paths:**
- `arcs/omicron/` - All manifests

**Namespace:**
- `arc-omicron` (defined in `arcs/omicron/omicron-api.yaml`)

**Resources Present:**
- ✅ Namespace: `arcs/omicron/omicron-api.yaml`
- ✅ Deployment: `arcs/omicron/omicron-api.yaml` (includes namespace, serviceaccount, deployment, service)
- ✅ Application code: `arcs/omicron/app/`

**Missing Pieces:**
- ❌ No kustomization.yaml
- ❌ Not in `apps/arcs/` directory (lives in `arcs/omicron/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- All resources in single file `omicron-api.yaml`
- Located in `arcs/` not `apps/arcs/`

---

### 16. **ARC Δ — Delta**

**Symbol:** Δ (Delta)  
**Status:** ⚠️ **INACTIVE** (Structure exists but empty)

**Directory Paths:**
- `arcs/delta/` - Kustomization structure

**Namespace:**
- Unknown (no namespace defined)

**Resources Present:**
- ✅ Kustomization: `arcs/delta/kustomization.yaml`
- ⚠️ `arcs/delta/all.yaml` is empty

**Missing Pieces:**
- ❌ No namespace defined
- ❌ No resources (all.yaml is empty)
- ❌ Not in `apps/arcs/` directory (lives in `arcs/delta/`)
- ❌ Not included in `apps/arcs/kustomization.yaml` (not activated)

**Notes:**
- Kustomization structure exists but no actual resources
- Appears to be a template or placeholder

---

## Summary by Status

### ✅ **ACTIVATED** (Included in apps/arcs/kustomization.yaml)
- **Chi** (base only)

### ⚠️ **PARTIALLY WIRED** (Structure exists but not activated)
- **Phi** (base + overlay, path issue)
- **Lambda** (overlay only, path issue)
- **Zeta** (complete structure, path issue)
- **Rho2** (base resources, no aggregation)
- **UI** (overlay only, path issue)

### ⚠️ **INACTIVE** (Manifests exist but no kustomization structure)
- **Omega** (legacy manifests only)
- **Sigma** (legacy manifests only)
- **Xi** (manifests exist, no kustomization)
- **Psi** (manifests exist, no kustomization)

### ⚠️ **INACTIVE** (In arcs/ directory, not apps/arcs/)
- **Epsilon** (complete structure in arcs/)
- **Iota** (minimal structure in arcs/)
- **Mu** (single file in arcs/)
- **Nu** (single file in arcs/)
- **Omicron** (single file in arcs/)
- **Delta** (empty structure in arcs/)

---

## Common Issues

### 1. **Overlay Path Issue**
Multiple Arcs (Phi, Lambda, Zeta, UI) reference `../../../_base` but `apps/arcs/_base/` has no kustomization.yaml. Only `apps/arcs/_base/app/kustomization.yaml` exists.

**Affected Arcs:** Phi, Lambda, Zeta, UI

### 2. **Live Resource Dumps**
Several `apps/arcs/arc-*/netpol/` directories contain live resource dumps (files with status, creationTimestamp, etc.) that should be removed:
- `apps/arcs/arc-lambda/netpol/lambda-egress.yaml`
- `apps/arcs/arc-omega/netpol/omega-egress.yaml`
- `apps/arcs/arc-phi/netpol/phi-egress.yaml`
- `apps/arcs/arc-sigma/netpol/sigma-egress.yaml`
- `apps/arcs/arc-zeta/netpol/zeta-egress.yaml`

### 3. **Missing Root Kustomization Inclusion**
Only Chi is included in `apps/arcs/kustomization.yaml`. All other Arcs need to be added when ready for activation.

### 4. **Location Inconsistency**
Some Arcs are in `arcs/` directory (Epsilon, Iota, Mu, Nu, Omicron, Delta) while others are in `apps/arcs/`. This creates confusion about which location is canonical.

---

## Activation Readiness

**Ready for Activation (after path fixes):**
- Phi
- Zeta
- Lambda
- UI

**Needs Kustomization Structure:**
- Omega
- Sigma
- Xi
- Psi

**Needs Migration from arcs/ to apps/arcs/:**
- Epsilon
- Iota
- Mu
- Nu
- Omicron

**Needs Resources:**
- Delta (empty structure)

---

**End of Inventory**
