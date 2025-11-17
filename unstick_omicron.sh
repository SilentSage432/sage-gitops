#!/usr/bin/env bash
set -euo pipefail
NS="arc-omicron"; DEP="omicron-api"; APP_LABEL="app=omicron-api"

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "Omicron rollout unblock (Θ + Rho² Soft Enforcement)"

# Newest ReplicaSet (highest revision)
NEW_RS="$(kubectl -n "$NS" get rs -l "$APP_LABEL" -o json 2>/dev/null \
  | jq -r '.items
            | sort_by(.metadata.annotations["deployment.kubernetes.io/revision"]|tonumber)
            | last
            | .metadata.name // empty')"
echo "New RS: ${NEW_RS:-<none>}"

# All old ReplicaSets (everything that's not NEW_RS)
OLD_RS="$(kubectl -n "$NS" get rs -l "$APP_LABEL" -o json 2>/dev/null \
  | jq -r --arg NEW "$NEW_RS" '.items[] | select(.metadata.name != $NEW) | .metadata.name')"
echo "Old RS:"
printf '  %s\n' $OLD_RS

# Pods not owned by NEW_RS (i.e., old replicas still around)
OLD_PODS="$(kubectl -n "$NS" get pods -l "$APP_LABEL" -o json 2>/dev/null \
  | jq -r --arg NEW "$NEW_RS" '
      .items[]
      | select(((.metadata.ownerReferences // []) | map(.name) | index($NEW)) | not)
      | .metadata.name')"
echo "Old pods:"
printf '  %s\n' $OLD_PODS

# If any old pod's node is cordoned, uncordon it
for p in $OLD_PODS; do
  NODE="$(kubectl -n "$NS" get pod "$p" -o jsonpath='{.spec.nodeName}' 2>/dev/null || true)"
  if [[ -n "${NODE}" ]]; then
    if kubectl get node "$NODE" -o jsonpath='{.spec.unschedulable}' 2>/dev/null | grep -q true; then
      echo "Uncordoning node $NODE"
      kubectl uncordon "$NODE" || true
    fi
  fi
done

# Force-remove stuck old pods (clear finalizers, then delete)
for p in $OLD_PODS; do
  echo "Clearing finalizers + force deleting pod $p"
  kubectl -n "$NS" patch pod "$p" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
  kubectl -n "$NS" delete pod "$p" --grace-period=0 --force >/dev/null 2>&1 || true
done

# Scale old RS to 0 and clear any RS finalizers
for rs in $OLD_RS; do
  echo "Scaling old RS $rs to 0"
  kubectl -n "$NS" scale rs "$rs" --replicas=0 >/dev/null 2>&1 || true
  kubectl -n "$NS" patch rs "$rs" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
done

# Ensure deployment can progress
kubectl -n "$NS" patch deploy "$DEP" --type='merge' -p \
'{"spec":{"replicas":1,"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":0,"maxSurge":1}},"progressDeadlineSeconds":120}}' \
>/dev/null 2>&1 || true

echo "Restarting deployment and waiting…"
kubectl -n "$NS" rollout restart deploy "$DEP" >/dev/null 2>&1 || true
kubectl -n "$NS" rollout status  deploy "$DEP" --timeout=180s

echo "Pods:"
kubectl -n "$NS" get pods -l "$APP_LABEL" -o wide || kubectl -n "$NS" get pods -o wide

# Quick auth soft-mode sniff so we can move on with Θ + Rho²
POD="$(kubectl -n "$NS" get pods -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [[ -n "$POD" ]]; then
  echo "Recent auth soft-mode lines (90s):"
  kubectl -n "$NS" logs "$POD" --since=90s 2>/dev/null | egrep -i 'auth|jwt|jwks|scope|soft|unauthoriz|rho2' || true
fi

bold "Done."
