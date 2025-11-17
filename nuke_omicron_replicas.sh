#!/usr/bin/env bash
set -euo pipefail

NS="arc-omicron"
DEP="omicron-api"
APP_LABEL="app=omicron-api"

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "Nuking old ReplicaSets & pods for $NS/$DEP"

# 0) Snapshot
kubectl -n "$NS" get deploy "$DEP" -o wide || true
kubectl -n "$NS" get rs -l "$APP_LABEL" --sort-by=.metadata.creationTimestamp || true
kubectl -n "$NS" get pods -l "$APP_LABEL" -o wide || true

# 1) Find newest RS by revision (keep this one)
NEW_RS="$(kubectl -n "$NS" get rs -l "$APP_LABEL" -o json 2>/dev/null \
  | jq -r '.items
            | map(. + {rev: ((.metadata.annotations["deployment.kubernetes.io/revision"]//"0")|tonumber)})
            | sort_by(.rev)
            | last
            | .metadata.name // empty')"
echo "Newest RS (kept): ${NEW_RS:-<none>}"

# 2) Scale deployment to 0 (stop controller spawning more)
kubectl -n "$NS" scale deploy "$DEP" --replicas=0 >/dev/null 2>&1 || true

# 3) Delete ALL pods for this app (clear finalizers first)
for p in $(kubectl -n "$NS" get pods -l "$APP_LABEL" -o name 2>/dev/null || true); do
  echo "Clearing finalizers + force deleting $p"
  kubectl -n "$NS" patch "$p" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
  kubectl -n "$NS" delete "$p" --grace-period=0 --force >/dev/null 2>&1 || true
done

# 4) Delete ALL old ReplicaSets (anything not the newest)
for rs in $(kubectl -n "$NS" get rs -l "$APP_LABEL" -o json 2>/dev/null \
              | jq -r --arg NEW "$NEW_RS" '.items[] | select(.metadata.name != $NEW) | .metadata.name'); do
  echo "Removing old RS $rs (scale 0, clear finalizers, delete)"
  kubectl -n "$NS" scale rs "$rs" --replicas=0 >/dev/null 2>&1 || true
  kubectl -n "$NS" patch rs "$rs" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
  kubectl -n "$NS" delete rs "$rs" --wait=true >/dev/null 2>&1 || true
done

# 5) Make sure the Deployment itself can progress cleanly
kubectl -n "$NS" patch deploy "$DEP" --type=merge -p \
'{
  "spec":{
    "strategy":{"type":"Recreate"},
    "revisionHistoryLimit": 1,
    "progressDeadlineSeconds": 120
  }
}' >/dev/null 2>&1 || true

# 6) Bump template annotation so we get a brand-new RS
kubectl -n "$NS" patch deploy "$DEP" --type=merge -p \
"{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"sage.nuke.ts\":\"$(date +%s)\"}}}}}" >/dev/null

# 7) Scale up and wait
kubectl -n "$NS" scale deploy "$DEP" --replicas=1
set +e
kubectl -n "$NS" rollout status deploy/"$DEP" --timeout=180s
RC=$?
set -e

# 8) Show current RS/pods
kubectl -n "$NS" get rs -l "$APP_LABEL" --sort-by=.metadata.creationTimestamp
kubectl -n "$NS" get pods -l "$APP_LABEL" -o wide

# 9) If still not progressing, print the most useful diags
if [ $RC -ne 0 ]; then
  echo
  echo "=== Deployment still blocked — quick diagnostics ==="
  kubectl -n "$NS" get events --sort-by=.lastTimestamp | tail -n 80 || true
  # First Pending pod describe (if any)
  PENDING="$(kubectl -n "$NS" get pods -l "$APP_LABEL" --field-selector=status.phase=Pending -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  if [ -n "${PENDING:-}" ]; then
    echo
    echo "Describe of first Pending pod: $PENDING"
    kubectl -n "$NS" describe pod "$PENDING" | sed -n '1,220p'
  fi
  echo
  echo "Nodes (schedulability + taints):"
  kubectl get nodes -o wide
  kubectl get nodes -o json | jq -r '.items[] | "\(.metadata.name) unsched=\(.spec.unschedulable//false) taints=\(.spec.taints//[])"'
fi

exit 0
