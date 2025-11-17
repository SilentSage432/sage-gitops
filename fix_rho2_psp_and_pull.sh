#!/usr/bin/env bash
set -euo pipefail

RHO_NS="arc-rho2"
SRC_NS="arc-omicron"

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "1) Ensure ghcr-creds exists in $RHO_NS (copy from $SRC_NS if present)"
if ! kubectl -n "$RHO_NS" get secret ghcr-creds >/dev/null 2>&1; then
  if kubectl -n "$SRC_NS" get secret ghcr-creds >/dev/null 2>&1; then
    kubectl -n "$SRC_NS" get secret ghcr-creds -o json \
      | jq 'del(.metadata.namespace,.metadata.uid,.metadata.resourceVersion,.metadata.creationTimestamp,.metadata.managedFields)' \
      | jq '.metadata += {"namespace":"'"$RHO_NS"'"}' \
      | kubectl apply -f - >/dev/null
    echo "✓ ghcr-creds copied into $RHO_NS"
  else
    echo "⚠️  ghcr-creds not found in $SRC_NS or $RHO_NS. If your images are private on GHCR, create it:"
    echo "    kubectl -n $RHO_NS create secret docker-registry ghcr-creds --docker-server=ghcr.io --docker-username=<u> --docker-password=<p> --docker-email=<e>"
  fi
fi

bold "2) Patch rho2-gate (Deployment) for restricted PodSecurity + imagePullSecrets"
kubectl -n "$RHO_NS" patch deploy rho2-gate --type='merge' -p '{
  "spec": {
    "template": {
      "spec": {
        "imagePullSecrets": [{"name":"ghcr-creds"}],
        "securityContext": { "runAsNonRoot": true, "seccompProfile": { "type":"RuntimeDefault" } },
        "tolerations": [
          {"key":"node-role.kubernetes.io/control-plane","operator":"Exists","effect":"NoSchedule"},
          {"key":"node-role.kubernetes.io/master","operator":"Exists","effect":"NoSchedule"}
        ],
        "containers": [{
          "name": "gate",
          "securityContext": {
            "allowPrivilegeEscalation": false,
            "readOnlyRootFilesystem": true,
            "runAsNonRoot": true,
            "capabilities": { "drop": ["ALL"] }
          }
        }]
      }
    }
  }
}' >/dev/null || true

bold "3) Patch rho2-rotate (CronJob jobTemplate) for restricted PodSecurity + imagePullSecrets"
kubectl -n "$RHO_NS" patch cronjob rho2-rotate --type='merge' -p '{
  "spec": {
    "jobTemplate": {
      "spec": {
        "template": {
          "spec": {
            "imagePullSecrets": [{"name":"ghcr-creds"}],
            "securityContext": { "runAsNonRoot": true, "seccompProfile": { "type":"RuntimeDefault" } },
            "tolerations": [
              {"key":"node-role.kubernetes.io/control-plane","operator":"Exists","effect":"NoSchedule"},
              {"key":"node-role.kubernetes.io/master","operator":"Exists","effect":"NoSchedule"}
            ],
            "containers": [{
              "name": "rotator",
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "readOnlyRootFilesystem": true,
                "runAsNonRoot": true,
                "capabilities": { "drop": ["ALL"] }
              }
            }]
          }
        }
      }
    }
  }
}' >/dev/null || true

bold "4) Roll rho2-gate and trigger a fresh rotate Job"
kubectl -n "$RHO_NS" rollout restart deploy/rho2-gate >/dev/null || true
kubectl -n "$RHO_NS" rollout status  deploy/rho2-gate --timeout=180s || true

# Clean previous rotate Jobs (best-effort)
for j in $(kubectl -n "$RHO_NS" get jobs -o name 2>/dev/null | grep rho2-rotate || true); do
  kubectl -n "$RHO_NS" delete "$j" --ignore-not-found >/dev/null 2>&1 || true
done
# Kick a manual run from the CronJob
JOB_NAME="rho2-rotate-manual-$(date +%s)"
kubectl -n "$RHO_NS" create job --from=cronjob/rho2-rotate "$JOB_NAME" >/dev/null

bold "5) Status snapshot"
kubectl -n "$RHO_NS" get pods -o wide
echo
kubectl -n "$RHO_NS" describe job "$JOB_NAME" | sed -n '1,200p' || true
echo
kubectl -n "$RHO_NS" get events --sort-by=.lastTimestamp | tail -n 60 || true

bold "6) If the Job is ImagePullBackOff, show why"
POD="$(kubectl -n "$RHO_NS" get pods -l job-name="$JOB_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [[ -n "${POD:-}" ]]; then
  PHASE="$(kubectl -n "$RHO_NS" get pod "$POD" -o jsonpath='{.status.phase}' 2>/dev/null || echo "")"
  echo "Pod: $POD  Phase: $PHASE"
  kubectl -n "$RHO_NS" describe pod "$POD" | sed -n '1,220p' || true
fi

bold "Done."
