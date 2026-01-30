# Sage-API Chi Observation RBAC Checklist

Reference: Chi observation signals in `kubernetes/arc-ui/sage-api-simple.yaml`  
(`get_chi_presence_signal`, `get_chi_bus_readiness_signal`). Read-only Kubernetes API; no app logic changes.

---

## 1) Required permissions (checklist)

| Signal | API path | Resource | API group | Namespace | Resource name | Verb |
|--------|----------|----------|-----------|-----------|---------------|------|
| chi.presence | `GET /api/v1/namespaces/arc-chi` | namespaces | `""` (core) | (cluster) | arc-chi | get |
| chi.presence | `GET .../namespaces/arc-chi/deployments/chi-idle` | deployments | apps | arc-chi | chi-idle | get |
| chi.bus_readiness | `GET .../namespaces/arc-chi/services/chi-bus` | services | `""` (core) | arc-chi | chi-bus | get |
| chi.bus_readiness | `GET .../namespaces/arc-chi/endpoints/chi-bus` | endpoints | `""` (core) | arc-chi | chi-bus | get |
| chi.bus_readiness | `GET .../namespaces/arc-chi/ciliumnetworkpolicies/chi-ingress` | ciliumnetworkpolicies | cilium.io | arc-chi | chi-ingress | get |

- **Namespaces**: cluster-scoped → use ClusterRole + ClusterRoleBinding.
- **Deployments, services, endpoints, ciliumnetworkpolicies**: namespaced in `arc-chi` → use Role in `arc-chi` + RoleBinding (subject: ServiceAccount `sage-api` in `arc-ui`).
- All verbs are **get** only (read-only).

---

## 2) Sage-API deployment verification

| Item | Status |
|------|--------|
| Deployment has `serviceAccountName: sage-api` | ✅ (sage-api-simple.yaml) |
| ServiceAccount `sage-api` in namespace `arc-ui` | ✅ Added in sage-api-chi-rbac.yaml |
| Role or ClusterRole granting the above permissions | ✅ ClusterRole `sage-api-chi-namespace-reader` + Role `sage-api-chi-observation` (arc-chi) |
| RoleBinding / ClusterRoleBinding attaching to `sage-api` | ✅ ClusterRoleBinding + RoleBinding in sage-api-chi-rbac.yaml |

---

## 3) Patch location

- **File**: `kubernetes/arc-ui/sage-api-chi-rbac.yaml`
- **Kustomization**: `kubernetes/arc-ui/kustomization.yaml` includes `sage-api-chi-rbac.yaml`
- **Flux**: Reconciled via Kustomization `arc-ui` (path `./kubernetes/arc-ui`).

No application logic or signal code changed; permissions are read-only and scoped to the resources above.
