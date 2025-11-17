#!/usr/bin/env bash
set -euo pipefail

NS="arc-omicron"
DEP="omicron-api"
APP_LABEL="app=omicron-api"

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "Θ + Rho² Soft Enforcement — Omicron hard reset (stuck old replica cleanup)"

# 0) Snapshot (for visibility + backup)
kubectl -n "$NS" get deploy "$DEP" -o wide || true
kubectl -n "$NS" get rs -l "$APP_LABEL" --sort-by=.metadata.creationTimestamp || true
kubectl -n "$NS" get pods -l "$APP_LABEL" -o wide || true
kubectl -n "$NS" get deploy "$DEP" -o yaml > /tmp/${DEP}.backup.yaml 2>/dev/null || true
echo "Backup of deployment (if existed): /tmp/${DEP}.backup.yaml"

# 1) Ensure strategy won't deadlock; set Recreate temporarily
kubectl -n "$NS" patch deploy "$DEP" --type='merge' -p \
'{"spec":{"strategy":{"type":"Recreate"},"progressDeadlineSeconds":120}}' >/dev/null 2>&1 || true

# 2) Scale to 0, then force-delete any leftover pods (clears finalizers first)
kubectl -n "$NS" scale deploy "$DEP" --replicas=0 >/dev/null 2>&1 || true
# Give controllers a moment
sleep 2
for p in $(kubectl -n "$NS" get pods -l "$APP_LABEL" -o name 2>/dev/null || true); do
  kubectl -n "$NS" patch "$p" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
  kubectl -n "$NS" delete "$p" --grace-period=0 --force >/dev/null 2>&1 || true
done

# 3) Nuke ALL old ReplicaSets for this app (start clean)
kubectl -n "$NS" delete rs -l "$APP_LABEL" --ignore-not-found >/dev/null 2>&1 || true

# 4) If deployment object is in a weird state, delete and re-apply
if ! kubectl -n "$NS" get deploy "$DEP" >/dev/null 2>&1; then
  echo "Deployment not found; attempting re-apply from repo manifest…"
else
  # Sometimes controller gets stuck; delete foreground to flush children
  kubectl -n "$NS" delete deploy "$DEP" --cascade=foreground --wait=true >/dev/null 2>&1 || true
fi

# 5) Recreate Deployment from git manifest if present; else from backup
if [ -f "k8s/arc-omicron/omicron-api.yaml" ]; then
  kubectl -n "$NS" apply -f k8s/arc-omicron/omicron-api.yaml
elif [ -f "/tmp/${DEP}.backup.yaml" ]; then
  kubectl -n "$NS" apply -f /tmp/${DEP}.backup.yaml
else
  echo "ERROR: No manifest found for $DEP (k8s/arc-omicron/omicron-api.yaml missing and no backup)."
  exit 1
fi

# 6) Ensure Θ + Rho² Soft-Mode env
kubectl -n "$NS" set env deploy/"$DEP" \
  AUTH_MODE="soft" \
  AUTH_PROVIDER="rho2" \
  AUTH_JWKS_CM="rho2-jwks" \
  AUTH_ISSUER="https://rho2.sage/issuer" \
  AUTH_AUDIENCE="sage-federation" \
  AUTH_REQUIRED_SCOPES="read:stream,write:archive" >/dev/null || true

# 7) Force a fresh ReplicaSet (change pod template annotation)
kubectl -n "$NS" patch deploy "$DEP" --type='merge' -p \
"{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"sage.rollout.ts\":\"$(date +%s)\"}}}}}" >/dev/null

# 8) Scale up and wait
kubectl -n "$NS" scale deploy "$DEP" --replicas=1
kubectl -n "$NS" rollout status deploy/"$DEP" --timeout=180s

# 9) Show pods + quick auth-soft log sniff
kubectl -n "$NS" get pods -l "$APP_LABEL" -o wide
POD="$(kubectl -n "$NS" get pods -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [[ -n "$POD" ]]; then
  echo
  echo "Recent Θ + Rho² soft-mode lines (last 120s):"
  kubectl -n "$NS" logs "$POD" --since=120s 2>/dev/null | egrep -i 'auth|jwt|jwks|scope|soft|unauthoriz|rho2' || true
fi

bold "Omicron reset complete."
