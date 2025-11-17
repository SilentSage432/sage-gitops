#!/usr/bin/env bash
set -euo pipefail
NS="arc-rho2"
CJ="rho2-rotate"
NODE="sage"

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "1) Snapshot rotate pod + quick events"
kubectl -n "$NS" get pods -l job-name -o wide | egrep "$CJ" || true
kubectl -n "$NS" get events --sort-by=.lastTimestamp | tail -n 60 || true

bold "2) Check Cilium agent on node $NODE"
CIL="$(kubectl -n kube-system get pods -o wide -l k8s-app=cilium | awk '/\s'"$NODE"'\s*$/ {print $1}')"
echo "Cilium pod on $NODE: ${CIL:-<none>}"
kubectl -n kube-system get pod "$CIL" -o wide || true
kubectl -n kube-system logs "$CIL" --since=2m | tail -n 120 || true

bold "3) If cilium taint still lingers, drop it; restart cilium DaemonSet on $NODE"
kubectl taint nodes "$NODE" node.cilium.io/agent-not-ready:NoSchedule- || true
# Roll just this node's cilium by deleting the pod; DaemonSet will recreate
[[ -n "${CIL:-}" ]] && kubectl -n kube-system delete pod "$CIL" --wait=false || true

bold "4) Wait a few seconds for Cilium to reattach, then re-check"
sleep 8
kubectl -n kube-system get pods -o wide -l k8s-app=cilium | awk 'NR==1 || /\s'"$NODE"'\s*$/ {print}'
kubectl describe node "$NODE" | sed -n '1,80p'

bold "5) Ensure rotate container is explicitly non-root-compatible"
# (Some images default to uid 0 even if allowed non-root; set uid/gid to 1001)
kubectl -n "$NS" patch cronjob "$CJ" --type='merge' -p '{
  "spec":{"jobTemplate":{"spec":{"template":{"spec":{
    "securityContext":{"runAsNonRoot":true, "seccompProfile":{"type":"RuntimeDefault"}},
    "tolerations":[
      {"key":"node-role.kubernetes.io/control-plane","operator":"Exists","effect":"NoSchedule"},
      {"key":"node-role.kubernetes.io/master","operator":"Exists","effect":"NoSchedule"}
    ],
    "volumes":[
      {"name":"tmp","emptyDir":{}},
      {"name":"work","configMap":{"name":"rho2-rotation"}}
    ],
    "containers":[{"name":"rotator",
      "image":"bitnami/kubectl:latest",
      "imagePullPolicy":"IfNotPresent",
      "env":[{"name":"HOME","value":"/tmp"}],
      "volumeMounts":[{"name":"tmp","mountPath":"/tmp"},{"name":"work","mountPath":"/work"}],
      "securityContext":{
        "allowPrivilegeEscalation":false,
        "readOnlyRootFilesystem":true,
        "runAsNonRoot":true,
        "runAsUser":1001,
        "runAsGroup":1001,
        "capabilities":{"drop":["ALL"]}
      },
      "command":["/bin/sh","-lc","test -f /work/rotate.sh && /bin/sh /work/rotate.sh || (echo 'rotate script not found; showing /work:'; ls -la /work; exit 1)"]
    }]
  }}}}}
}' >/dev/null || true

bold "6) Clean previous rotate Jobs and trigger a fresh one"
for j in $(kubectl -n "$NS" get jobs -o name 2>/dev/null | grep '^job.batch/'"$CJ"'-' || true); do
  kubectl -n "$NS" delete "$j" --ignore-not-found >/dev/null 2>&1 || true
done
JOB="${CJ}-manual-$(date +%s)"
kubectl -n "$NS" create job --from=cronjob/"$CJ" "$JOB" >/dev/null

bold "7) Wait for pod IP assignment (CNI attach) and show describe if slow"
for i in {1..40}; do
  POD="$(kubectl -n "$NS" get pods -l job-name="$JOB" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "${POD:-}" ]] || { sleep 1; continue; }
  IP="$(kubectl -n "$NS" get pod "$POD" -o jsonpath='{.status.podIP}' 2>/dev/null || true)"
  PHASE="$(kubectl -n "$NS" get pod "$POD" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
  echo "pod=$POD phase=$PHASE ip=${IP:-<none>}"
  [[ -n "${IP:-}" ]] && break
  sleep 3
done
[[ -z "${POD:-}" ]] && { echo "No pod created for $JOB"; kubectl -n "$NS" describe job "$JOB"; exit 3; }
[[ -z "${IP:-}" ]] && kubectl -n "$NS" describe pod "$POD" | sed -n '1,160p' || true

bold "8) Live logs (expect rotate to run now)"
kubectl -n "$NS" logs -f "$POD" || true

bold "9) Final status"
kubectl -n "$NS" get pods -l job-name="$JOB" -o wide
kubectl -n "$NS" get jobs "$JOB" -o wide
