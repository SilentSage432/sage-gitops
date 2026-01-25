# Flux Kustomization Map

**Generated:** 2026-01-24  
**Purpose:** Comprehensive analysis of all Flux Kustomizations in sage-gitops repository  
**Status:** Read-only analysis - no modifications made

---

## Summary Table

| Name | Namespace | Path | Valid | Depends On | Blocking Others | SourceRef | Interval | Prune | Wait |
|------|-----------|------|-------|------------|-----------------|-----------|----------|-------|------|
| flux-system | flux-system | ./clusters/sage | ✅ | - | apps, arcs | flux-system | 10m0s | true | - |
| apps | flux-system | ./apps | ❌ | - | arcs | flux-system | 1m | true | true |
| arcs | flux-system | ./apps/arcs | ❌ | apps | - | flux-system | 1m | true | true |
| prod | flux-system | ./clusters/prod | ✅ | - | - | flux-system | 10m | true | - |
| arc-ui | flux-system | ./kubernetes/arc-ui | ❌ | - | - | sage-gitops (⚠️) | 1m | true | true |

**Legend:**
- ✅ = Path exists and contains valid kustomization.yaml
- ❌ = Path exists but missing kustomization.yaml OR path doesn't exist
- ⚠️ = SourceRef issue (GitRepository doesn't exist)

---

## Detailed Analysis

### 1. flux-system

**Location:** `clusters/sage/flux-system/gotk-sync.yaml`

**Metadata:**
- **Name:** `flux-system`
- **Namespace:** `flux-system`
- **API Version:** `kustomize.toolkit.fluxcd.io/v1`

**Spec:**
- **Path:** `./clusters/sage`
- **Interval:** `10m0s`
- **Prune:** `true`
- **Wait:** Not specified
- **SourceRef:**
  - Kind: `GitRepository`
  - Name: `flux-system`
  - Namespace: Not specified (defaults to same namespace)
- **DependsOn:** None
- **Patches:** None
- **Images:** None

**Path Validation:**
- ✅ Path exists: `clusters/sage/`
- ✅ Contains kustomization.yaml: `clusters/sage/kustomization.yaml` exists
- ✅ Valid kustomize resource: Contains `apps.yaml` and `arcs.yaml` references

**Dependency Graph Position:** Root (no dependencies)

**Blocks:** `apps`, `arcs` (indirectly, as they are defined in the path it reconciles)

**Notes:**
- This is the root bootstrap Kustomization that reconciles the `clusters/sage` directory
- It reconciles `apps.yaml` and `arcs.yaml` which define the `apps` and `arcs` Kustomizations

---

### 2. apps

**Location:** `clusters/sage/apps.yaml`

**Metadata:**
- **Name:** `apps`
- **Namespace:** `flux-system`
- **API Version:** `kustomize.toolkit.fluxcd.io/v1`

**Spec:**
- **Path:** `./apps`
- **Interval:** `1m`
- **Prune:** `true`
- **Wait:** `true`
- **SourceRef:**
  - Kind: `GitRepository`
  - Name: `flux-system`
  - Namespace: `flux-system`
- **DependsOn:** None
- **Patches:** None
- **Images:** None

**Path Validation:**
- ✅ Path exists: `apps/` directory exists
- ❌ **MISSING kustomization.yaml:** `apps/kustomization.yaml` does NOT exist
- ⚠️ **ISSUE:** Flux will fail to reconcile this path because it lacks a kustomization.yaml file

**Dependency Graph Position:** Root (no dependencies, but path is invalid)

**Blocks:** `arcs` (arcs depends on apps)

**Notes:**
- **CRITICAL ISSUE:** The path `./apps` exists but does not contain a `kustomization.yaml` file
- This Kustomization will fail to reconcile
- Since `arcs` depends on `apps`, `arcs` will also be blocked

---

### 3. arcs

**Location:** `clusters/sage/arcs.yaml`

**Metadata:**
- **Name:** `arcs`
- **Namespace:** `flux-system`
- **API Version:** `kustomize.toolkit.fluxcd.io/v1`

**Spec:**
- **Path:** `./apps/arcs`
- **Interval:** `1m`
- **Prune:** `true`
- **Wait:** `true`
- **SourceRef:**
  - Kind: `GitRepository`
  - Name: `flux-system`
  - Namespace: `flux-system`
- **DependsOn:**
  - `apps` (must be Ready before arcs reconciles)
- **Patches:** None
- **Images:** None

**Path Validation:**
- ✅ Path exists: `apps/arcs/` directory exists
- ❌ **MISSING kustomization.yaml:** `apps/arcs/kustomization.yaml` does NOT exist
- ⚠️ **ISSUE:** Flux will fail to reconcile this path because it lacks a kustomization.yaml file

**Dependency Graph Position:** Leaf (depends on `apps`)

**Blocks:** None

**Notes:**
- **CRITICAL ISSUE:** The path `./apps/arcs` exists but does not contain a `kustomization.yaml` file
- This Kustomization will fail to reconcile
- Additionally blocked by dependency on `apps` (which also has path issues)
- The `apps/arcs/` directory contains many subdirectories with kustomization.yaml files, but no root kustomization.yaml

---

### 4. prod

**Location:** `infra/kustomization-prod.yaml`

**Metadata:**
- **Name:** `prod`
- **Namespace:** `flux-system` (patched via `infra/patches/prod-ks-namespace.yaml`)
- **API Version:** `kustomize.toolkit.fluxcd.io/v1`

**Spec:**
- **Path:** `./clusters/prod`
- **Interval:** `10m`
- **Prune:** `true`
- **Wait:** Not specified
- **SourceRef:**
  - Kind: `GitRepository`
  - Name: `flux-system`
  - Namespace: `flux-system`
- **DependsOn:** None
- **Patches:** None (but itself is patched by `infra/patches/prod-ks-namespace.yaml`)
- **Images:** None

**Path Validation:**
- ✅ Path exists: `clusters/prod/` directory exists
- ✅ Contains kustomization.yaml: `clusters/prod/kustomization.yaml` exists
- ✅ Valid kustomize resource: Contains references to `./platform/tailscale`, `./observability`, `./platform/cloudflared`

**Dependency Graph Position:** Root (no dependencies)

**Blocks:** None

**Notes:**
- This Kustomization is defined in `infra/kustomization-prod.yaml` but patched to ensure it lives in `flux-system` namespace
- The path `./clusters/prod` contains a valid kustomization.yaml that references:
  - `./platform/tailscale` (has kustomization.yaml)
  - `./observability` (has kustomization.yaml)
  - `./platform/cloudflared` (has kustomization.yaml)

---

### 5. arc-ui

**Location:** `arc-ui-kustomization.yaml`

**Metadata:**
- **Name:** `arc-ui`
- **Namespace:** `flux-system`
- **API Version:** `kustomize.toolkit.fluxcd.io/v1`

**Spec:**
- **Path:** `./kubernetes/arc-ui`
- **Interval:** `1m`
- **Prune:** `true`
- **Wait:** `true`
- **Timeout:** `2m`
- **TargetNamespace:** `arc-ui`
- **SourceRef:**
  - Kind: `GitRepository`
  - Name: `sage-gitops` ⚠️
  - Namespace: Not specified
- **DependsOn:** None
- **Patches:** None
- **Images:** None

**Path Validation:**
- ✅ Path exists: `kubernetes/arc-ui/` directory exists
- ❌ **MISSING kustomization.yaml:** `kubernetes/arc-ui/kustomization.yaml` does NOT exist
- ⚠️ **ISSUE:** Flux will fail to reconcile this path because it lacks a kustomization.yaml file

**Dependency Graph Position:** Root (no dependencies)

**Blocks:** None

**Notes:**
- **CRITICAL ISSUE 1:** The path `./kubernetes/arc-ui` exists but does not contain a `kustomization.yaml` file
- **CRITICAL ISSUE 2:** The SourceRef references `sage-gitops` GitRepository, but only `flux-system` GitRepository exists
- This Kustomization will fail to reconcile due to both issues
- The directory contains individual YAML files (sage-api-simple.yaml, sage-enterprise-ui.yaml, etc.) but no kustomization.yaml to aggregate them

---

## Reconciliation Dependency Graph

```
Root Level (no dependencies):
├── flux-system
│   └── Reconciles: clusters/sage/
│       ├── apps.yaml → creates "apps" Kustomization
│       └── arcs.yaml → creates "arcs" Kustomization
│
├── prod
│   └── Reconciles: clusters/prod/
│       ├── platform/tailscale/
│       ├── observability/
│       └── platform/cloudflared/
│
└── arc-ui
    └── Reconciles: kubernetes/arc-ui/ (⚠️ invalid)

Dependent Level:
└── arcs
    └── Depends on: apps
    └── Reconciles: apps/arcs/ (⚠️ invalid)
```

**Blocking Relationships:**
- `flux-system` → indirectly blocks `apps` and `arcs` (creates them)
- `apps` → blocks `arcs` (dependency)
- If `apps` is not Ready, `arcs` will not reconcile

---

## Issues Summary

### Critical Issues

1. **apps Kustomization - Missing kustomization.yaml**
   - Path: `./apps`
   - Issue: Directory exists but no `kustomization.yaml` file
   - Impact: Kustomization will fail to reconcile
   - Blocks: `arcs` Kustomization

2. **arcs Kustomization - Missing kustomization.yaml**
   - Path: `./apps/arcs`
   - Issue: Directory exists but no `kustomization.yaml` file
   - Impact: Kustomization will fail to reconcile
   - Blocked by: `apps` (dependency) + missing kustomization.yaml

3. **arc-ui Kustomization - Missing kustomization.yaml**
   - Path: `./kubernetes/arc-ui`
   - Issue: Directory exists but no `kustomization.yaml` file
   - Impact: Kustomization will fail to reconcile

4. **arc-ui Kustomization - Invalid SourceRef**
   - SourceRef: `sage-gitops` GitRepository
   - Issue: GitRepository named `sage-gitops` does not exist (only `flux-system` exists)
   - Impact: Kustomization will fail to reconcile

### Valid Kustomizations

1. **flux-system** - ✅ Valid
   - Path exists and contains valid kustomization.yaml
   - SourceRef is valid

2. **prod** - ✅ Valid
   - Path exists and contains valid kustomization.yaml
   - SourceRef is valid
   - All referenced sub-paths have valid kustomization.yaml files

---

## Path Structure Analysis

### Valid Paths with kustomization.yaml

```
clusters/sage/
└── kustomization.yaml ✅

clusters/prod/
├── kustomization.yaml ✅
├── platform/
│   ├── tailscale/
│   │   └── kustomization.yaml ✅
│   └── cloudflared/
│       └── kustomization.yaml ✅
└── observability/
    └── kustomization.yaml ✅
```

### Invalid Paths (missing kustomization.yaml)

```
apps/
└── (no kustomization.yaml) ❌

apps/arcs/
└── (no kustomization.yaml) ❌
    └── Contains subdirectories with kustomization.yaml files, but no root file

kubernetes/arc-ui/
└── (no kustomization.yaml) ❌
    └── Contains individual YAML files but no aggregation kustomization.yaml
```

---

## Recommendations

### Immediate Actions Required

1. **Create `apps/kustomization.yaml`**
   - Required for `apps` Kustomization to reconcile
   - Should aggregate resources in the `apps/` directory

2. **Create `apps/arcs/kustomization.yaml`**
   - Required for `arcs` Kustomization to reconcile
   - Should aggregate arc-related resources

3. **Create `kubernetes/arc-ui/kustomization.yaml`**
   - Required for `arc-ui` Kustomization to reconcile
   - Should aggregate resources in `kubernetes/arc-ui/`

4. **Fix `arc-ui` SourceRef**
   - Change from `sage-gitops` to `flux-system`
   - Or create `sage-gitops` GitRepository if it's intended to be separate

### Validation Notes

- All paths are relative to the repository root
- SourceRef validation: Only `flux-system` GitRepository exists
- Dependency chain: `apps` → `arcs` must be maintained
- All valid paths use standard kustomize structure

---

## Appendix: Kustomization Resource Locations

| Kustomization | Resource File Location |
|---------------|------------------------|
| flux-system | `clusters/sage/flux-system/gotk-sync.yaml` |
| apps | `clusters/sage/apps.yaml` |
| arcs | `clusters/sage/arcs.yaml` |
| prod | `infra/kustomization-prod.yaml` (patched by `infra/patches/prod-ks-namespace.yaml`) |
| arc-ui | `arc-ui-kustomization.yaml` |

---

**End of Report**
