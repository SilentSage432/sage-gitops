# Federation Arc Readiness & Activation Analysis

**Generated:** 2026-01-25  
**Repository:** sage-gitops  
**Analysis Type:** READ-ONLY (No modifications made)

---

## Section 1: Global Findings

### Flux Kustomization Status

**Critical Blocking Issues:**

1. **`apps` Kustomization (flux-system namespace)**
   - **Path:** `./apps`
   - **Status:** ❌ **BLOCKED**
   - **Issue:** Directory exists but **missing `kustomization.yaml`**
   - **Impact:** Flux cannot reconcile this path
   - **Blocks:** `arcs` Kustomization (which depends on `apps`)

2. **`arcs` Kustomization (flux-system namespace)**
   - **Path:** `./apps/arcs`
   - **Status:** ❌ **BLOCKED**
   - **Issue:** Directory exists but **missing `kustomization.yaml`**
   - **Impact:** Flux cannot reconcile this path
   - **Blocked by:** Dependency on `apps` (which is also blocked)

### Directory Structure Analysis

**Key Finding:** The `apps/arcs/` directory contains multiple subdirectories with individual `kustomization.yaml` files, but **no root `kustomization.yaml`** to aggregate them. Flux requires a root kustomization file to reconcile a directory path.

**Additional Finding:** The `apps/arcs/arc-*/netpol/` directories contain **live resource dumps** (files with `status`, `creationTimestamp`, `resourceVersion`, `uid` fields). These are not proper manifest files and should not be in the repository.

---

## Section 2: Arc-by-Arc Table

| Arc Name | Directory Paths | In Flux? | Kustomize Structure | Namespace | CRDs | Network Policies | Dependencies | Status |
|----------|----------------|----------|---------------------|-----------|------|------------------|--------------|--------|
| **Chi** | `apps/arcs/chi/base/`<br>`apps/arcs/arc-chi/netpol/`<br>`kubernetes/arc-chi/` | ❌ No (blocked by missing root kustomization) | ✅ Base kustomization exists | ✅ `arc-chi` | ❌ None | ⚠️ **DUPLICATE CNP** | None (foundational) | ❌ **BLOCKED** |
| **Phi** | `apps/arcs/phi/base/`<br>`apps/arcs/phi/overlays/prod/`<br>`apps/arcs/arc-phi/netpol/` | ❌ No | ✅ Base + overlay | ✅ `arc-phi` | ❌ None | ⚠️ Live dump in arc-phi | Chi | ❌ **BLOCKED** |
| **Lambda** | `apps/arcs/lambda/overlays/prod/`<br>`apps/arcs/arc-lambda/netpol/`<br>`kubernetes/arc-lambda/` | ❌ No | ⚠️ Overlay only (no base) | ✅ `arc-lambda` | ❌ None | ⚠️ Live dump in arc-lambda | Chi | ❌ **BLOCKED** |
| **Zeta** | `apps/arcs/zeta/`<br>`apps/arcs/zeta/overlays/prod/`<br>`apps/arcs/arc-zeta/netpol/`<br>`arcs/zeta/` | ❌ No | ✅ Root + overlay | ✅ `arc-zeta` | ❌ None | ⚠️ Live dump in arc-zeta | Chi | ❌ **BLOCKED** |
| **Omega** | `apps/arcs/omega/`<br>`apps/arcs/arc-omega/netpol/`<br>`kubernetes/arc-omega/` | ❌ No | ❌ No kustomization | ✅ `arc-omega` | ❌ None | ⚠️ Live dump in arc-omega | Chi | ❌ **BLOCKED** |
| **Sigma** | `apps/arcs/arc-sigma/netpol/`<br>`kubernetes/arc-sigma/` | ❌ No | ❌ No kustomization | ✅ `arc-sigma` | ❌ None | ⚠️ Live dump in arc-sigma | Chi | ❌ **BLOCKED** |
| **UI** | `apps/arcs/ui/overlays/prod/`<br>`kubernetes/arc-ui/` | ⚠️ Separate kustomization | ✅ Overlay only | ✅ `arc-ui` | ❌ None | ✅ Proper manifests | Chi | ⚠️ **PARTIAL** |
| **Xi** | `apps/arcs/xi/` | ❌ No | ❌ No kustomization | ✅ `arc-xi` | ❌ None | ✅ Proper manifest | Chi, Rho2 | ❌ **BLOCKED** |
| **Psi** | `apps/arcs/psi/` | ❌ No | ❌ No kustomization | ✅ `arc-psi`, `arc-sandbox` | ❌ None | ✅ Proper manifest | Chi, Rho2 | ❌ **BLOCKED** |
| **Rho2** | `apps/arcs/rho2/base/` | ❌ No | ✅ Base only | ✅ `arc-rho2` | ⚠️ RotationPolicy CRD | ✅ Proper manifests | Chi | ❌ **BLOCKED** |
| **Theta** | `apps/theta/` | ❌ No | ❌ No kustomization | ⚠️ Not defined | ❌ None | ✅ Proper manifest | None | ❌ **BLOCKED** |

**Legend:**
- ✅ = Present and valid
- ❌ = Missing or invalid
- ⚠️ = Present but problematic

---

## Section 3: Chi Root Cause Analysis

### The Duplicate Resource ID Problem

**Error Message:**
```
may not add resource with an already registered id
CiliumNetworkPolicy.v2.cilium.io/chi-ingress.arc-chi
```

### Root Cause

**Two files define the same CNP resource:**

1. **Proper Manifest:** `apps/arcs/chi/base/chi-ingress-cnp.yaml`
   - **Type:** Proper Kubernetes manifest
   - **Resource:** `CiliumNetworkPolicy` named `chi-ingress` in namespace `arc-chi`
   - **Content:** Clean manifest without status fields
   - **Location:** `apps/arcs/chi/base/chi-ingress-cnp.yaml`
   - **Included by:** `apps/arcs/chi/base/kustomization.yaml`

2. **Live Resource Dump:** `apps/arcs/arc-chi/netpol/chi-ingress.yaml`
   - **Type:** Live resource dump (kubectl get output)
   - **Resource:** `CiliumNetworkPolicy` named `chi-ingress` in namespace `arc-chi`
   - **Content:** Contains `status`, `creationTimestamp`, `resourceVersion`, `uid` fields
   - **Location:** `apps/arcs/arc-chi/netpol/chi-ingress.yaml`
   - **Included by:** Unknown (no kustomization references this directory)

### Why This Causes Failure

When Flux/Kustomize processes resources, it registers each resource by its **fully qualified ID**: `kind.apiVersion/name.namespace`. If the same ID appears twice in the resource tree, Kustomize throws the error:

```
may not add resource with an already registered id
```

### How Both Files Could Be Included

**Scenario 1: Auto-discovery**
- If Flux is configured to auto-discover YAML files in `apps/arcs/`, it would find both files
- Both would be processed, causing the duplicate ID error

**Scenario 2: Manual Application**
- If `apps/arcs/arc-chi/netpol/chi-ingress.yaml` was manually applied to the cluster
- Then Flux tries to apply `apps/arcs/chi/base/chi-ingress-cnp.yaml`
- Kustomize sees the resource already exists and fails

**Scenario 3: Root Kustomization Includes Both**
- If a root `kustomization.yaml` exists (or is created) that includes both:
  - `chi/base` (which includes `chi-ingress-cnp.yaml`)
  - `arc-chi` (which contains `chi-ingress.yaml`)
- Both would be processed, causing the duplicate

### Exact File Locations

**File 1 (Proper):**
```
apps/arcs/chi/base/chi-ingress-cnp.yaml
├── Line 2: kind: CiliumNetworkPolicy
├── Line 4: name: chi-ingress
└── Line 5: namespace: arc-chi
```

**File 2 (Duplicate/Live Dump):**
```
apps/arcs/arc-chi/netpol/chi-ingress.yaml
├── Line 2: kind: CiliumNetworkPolicy
├── Line 9: name: chi-ingress
├── Line 10: namespace: arc-chi
├── Line 7: creationTimestamp: "2025-10-31T20:02:34Z"
├── Line 11: resourceVersion: "6359515"
├── Line 12: uid: f9b34ee5-0a04-4bd2-afbc-36dadbc033f2
└── Line 38-43: status: { conditions: [...] }
```

### Blocking Type Classification

**Block Type:** 🧱 **Duplication (Resource ID Collision)**

- **Structural:** No (both files are valid YAML)
- **Ordering:** No (not a dependency issue)
- **Duplication:** ✅ **YES** (same resource ID defined twice)
- **Missing Prerequisite:** No (namespace exists)

### Additional Findings

**Similar Pattern in Other Arcs:**
- `apps/arcs/arc-lambda/netpol/lambda-egress.yaml` - Live dump
- `apps/arcs/arc-omega/netpol/omega-egress.yaml` - Live dump
- `apps/arcs/arc-phi/netpol/phi-egress.yaml` - Live dump
- `apps/arcs/arc-sigma/netpol/sigma-egress.yaml` - Live dump
- `apps/arcs/arc-zeta/netpol/zeta-egress.yaml` - Live dump

**However:** These other Arcs don't have corresponding proper manifests in their base directories, so they won't cause duplicate ID errors (yet). They are still problematic as they contain live resource dumps.

---

## Section 4: Ordered Activation Readiness List

### Activation Order (Based on Dependencies)

#### Tier 1: Foundation (No Dependencies)

| Arc | Status | Blocking Reason | Prerequisites Needed | Can Activate Now? |
|-----|--------|-----------------|---------------------|-------------------|
| **Chi** | ❌ **BLOCKED** | Duplicate CNP resource ID: `chi-ingress.arc-chi` defined in both `apps/arcs/chi/base/chi-ingress-cnp.yaml` and `apps/arcs/arc-chi/netpol/chi-ingress.yaml`. Also blocked by missing root `kustomization.yaml` in `apps/arcs/`. | 1. Remove or exclude `apps/arcs/arc-chi/netpol/chi-ingress.yaml`<br>2. Create root `kustomization.yaml` in `apps/arcs/`<br>3. Ensure namespace `arc-chi` exists | ❌ **No** |

#### Tier 2: Chi-Dependent Arcs

| Arc | Status | Blocking Reason | Prerequisites Needed | Can Activate Now? |
|-----|--------|-----------------|---------------------|-------------------|
| **Phi** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. Overlay references `../../../_base` which points to `apps/arcs/_base` (no kustomization.yaml there - only in `_base/app/`). Live dump in `arc-phi/netpol/`. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Fix overlay resource path (`_base` vs `_base/app`)<br>3. Remove live dump or ensure no duplicate<br>4. Chi must be Ready | ❌ **No** |
| **Lambda** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. Overlay references `../../../_base` which points to `apps/arcs/_base` (no kustomization.yaml there). Live dump in `arc-lambda/netpol/`. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Fix overlay resource path<br>3. Remove live dump or ensure no duplicate<br>4. Chi must be Ready | ❌ **No** |
| **Zeta** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. Live dump in `arc-zeta/netpol/`. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Remove live dump or ensure no duplicate<br>3. Chi must be Ready | ❌ **No** |
| **Omega** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. No kustomization structure at all. Live dump in `arc-omega/netpol/`. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Create kustomization structure<br>3. Remove live dump or ensure no duplicate<br>4. Chi must be Ready | ❌ **No** |
| **Sigma** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. No kustomization structure. Live dump in `arc-sigma/netpol/`. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Create kustomization structure<br>3. Remove live dump or ensure no duplicate<br>4. Chi must be Ready | ❌ **No** |
| **UI** | ⚠️ **PARTIAL** | Separate Flux kustomization exists (`arc-ui-kustomization.yaml`) pointing to `kubernetes/arc-ui/`. However, that directory also lacks a root `kustomization.yaml`. | 1. Create `kustomization.yaml` in `kubernetes/arc-ui/`<br>2. Chi must be Ready (for NATS connectivity) | ⚠️ **Maybe** (if arc-ui kustomization is fixed) |

#### Tier 3: Chi + Rho2 Dependent Arcs

| Arc | Status | Blocking Reason | Prerequisites Needed | Can Activate Now? |
|-----|--------|-----------------|---------------------|-------------------|
| **Xi** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. No kustomization structure. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Create kustomization structure<br>3. Chi must be Ready<br>4. Rho2 must be Ready | ❌ **No** |
| **Psi** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. No kustomization structure. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Create kustomization structure<br>3. Chi must be Ready<br>4. Rho2 must be Ready | ❌ **No** |
| **Rho2** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/arcs/`. Base kustomization exists but not included in root. CRD `RotationPolicy` may need to be applied first. | 1. Fix `apps` and `arcs` root kustomizations<br>2. Ensure CRD is applied before dependent resources<br>3. Chi must be Ready | ❌ **No** |

#### Tier 4: Independent/System Arcs

| Arc | Status | Blocking Reason | Prerequisites Needed | Can Activate Now? |
|-----|--------|-----------------|---------------------|-------------------|
| **Theta** | ❌ **BLOCKED** | Missing root `kustomization.yaml` in `apps/`. No namespace defined. | 1. Create `kustomization.yaml` in `apps/`<br>2. Define namespace<br>3. Create kustomization structure | ❌ **No** |

---

## Summary of Blocking Issues

### Critical Path to Unblock Chi

1. **Remove Duplicate CNP:**
   - Delete or exclude `apps/arcs/arc-chi/netpol/chi-ingress.yaml`
   - OR ensure it's not included in any kustomization

2. **Create Root Kustomizations:**
   - Create `apps/kustomization.yaml` that includes subdirectories
   - Create `apps/arcs/kustomization.yaml` that includes Chi base

3. **Verify Namespace:**
   - Ensure `arc-chi` namespace exists (check `kubernetes/common/namespaces.yaml`)

### Additional Issues Found

1. **Overlay Resource Path Issue:**
   - Phi, Lambda, UI, Zeta overlays reference `../../../_base`
   - But `apps/arcs/_base/` has no `kustomization.yaml`
   - Only `apps/arcs/_base/app/kustomization.yaml` exists
   - **Fix:** Change overlays to reference `../../../_base/app` OR create `apps/arcs/_base/kustomization.yaml`

2. **Live Resource Dumps:**
   - All `apps/arcs/arc-*/netpol/*.yaml` files are live dumps
   - Should be removed or converted to proper manifests

3. **Missing Kustomization Structures:**
   - Omega, Sigma, Xi, Psi have no kustomization files
   - Need base kustomizations created

---

## Recommendations (Non-Executing)

### Immediate Actions Required

1. **For Chi:**
   - Remove `apps/arcs/arc-chi/netpol/chi-ingress.yaml` (live dump)
   - Create `apps/arcs/kustomization.yaml` that includes `chi/base`
   - Create `apps/kustomization.yaml` that includes `arcs`

2. **For Other Arcs:**
   - Remove all live dump files in `apps/arcs/arc-*/netpol/` directories
   - Fix overlay resource paths (change `_base` to `_base/app` OR create `_base/kustomization.yaml`)
   - Create missing kustomization structures for Omega, Sigma, Xi, Psi

3. **For Flux:**
   - Ensure `apps` and `arcs` Flux Kustomizations can reconcile
   - Verify namespace creation order
   - Ensure CRDs are applied before dependent resources (Rho2)

---

**End of Report**
