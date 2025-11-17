#!/usr/bin/env bash
set -euo pipefail
NS="arc-rho2"
CJ="rho2-rotate"
IMG_PRIMARY="bitnami/kubectl:1.30.4"   # has /bin/sh
IMG_FALLBACK="bitnami/kubectl:latest"  # fallback if tag not found

say(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

patch_cj_image(){
  local img="$1"
  kubectl -n "$NS" patch cronjob "$CJ" --type='strategic' -p "{
    \"spec\": { \"jobTemplate\": { \"spec\": { \"template\": { \"spec\": {
      \"imagePullSecrets\": [],
      \"volumes\": [
        { \"name\": \"tmp\",  \"emptyDir\": {} },
        { \"name\": \"work\", \"configMap\": { \"name\": \"rho2-rotation\" } }
      ],
      \"securityContext\": { \"runAsNonRoot\": true, \"seccompProfile\": { \"type\":\"RuntimeDefault\" } },
      \"tolerations\": [
        { \"key\":\"node-role.kubernetes.io/control-plane\",\"operator\":\"Exists\",\"effect\":\"NoSchedule\" },
        { \"key\":\"node-role.kubernetes.io/master\",\"operator\":\"Exists\",\"effect\":\"NoSchedule\" }
      ],
      \"containers\": [{
        \"name\": \"rotator\",
        \"image\": \"${img}\",
        \"imagePullPolicy\": \"IfNotPresent\",
        \"terminationMessagePolicy\": \"FallbackToLogsOnError\",
        \"env\": [{ \"name\":\"HOME\", \"value\":\"/tmp\" }],
        \"volumeMounts\": [
          { \"name\":\"tmp\",  \"mountPath\":\"/tmp\" },
          { \"name\":\"work\", \"mountPath\":\"/work\" }
        ],
        \"securityContext\": {
          \"allowPrivilegeEscalation\": false,
          \"readOnlyRootFilesystem\": true,
          \"runAsNonRoot\": true,
          \"capabilities\": { \"drop\": [\"ALL\"] }
        },
        \"command\": [\"/bin/sh\",\"-lc\",\"test -f /work/rotate.sh && /bin/sh /work/rotate.sh || (echo 'rotate script not found at /work/rotate.sh'; ls -la /work; exit 1)\"]
      }]
    }}}}}
  }" >/dev/null
}

run_job_once(){
  # prune prior jobs
  for j in $(kubectl -n "$NS" get jobs -o name 2>/dev/null | grep "$CJ" || true); do
    kubectl -n "$NS" delete "$j" --ignore-not-found >/dev/null 2>&1 || true
  done
  local job="${CJ}-manual-$(date +%s)"
  kubectl -n "$NS" create job --from=cronjob/"$CJ" "$job" >/dev/null

  # wait for pod
  local pod=""
  for i in {1..40}; do
    pod="$(kubectl -n "$NS" get pods -l job-name="$job" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
    [[ -n "$pod" ]] && break || sleep 1
  done
  [[ -z "$pod" ]] && { echo "No pod created for $job"; kubectl -n "$NS" describe job "$job"; return 9; }

  # watch state briefly
  local reason=""
  for i in {1..24}; do
    reason="$(kubectl -n "$NS" get pod "$pod" -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
    phase="$(kubectl -n "$NS" get pod "$pod" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
    [[ "$phase" == "Running" || "$phase" == "Succeeded" ]] && break
    [[ "$reason" == "ErrImagePull" || "$reason" == "ImagePullBackOff" ]] && break
    sleep 3
  done

  if [[ "$reason" == "ErrImagePull" || "$reason" == "ImagePullBackOff" ]]; then
    echo "Image pull error detected for pod $pod"
    kubectl -n "$NS" describe pod "$pod" | sed -n '1,160p'
    return 8
  fi

  # show quick logs (non-follow)
  echo "---- logs (${pod}) ----"
  kubectl -n "$NS" logs "$pod" || true

  echo "---- status ----"
  kubectl -n "$NS" get pods -l job-name="$job" -o wide
  kubectl -n "$NS" get jobs "$job" -o wide
  # success if job completed
  status="$(kubectl -n "$NS" get jobs "$job" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo 0)"
  [[ "${status:-0}" == "1" ]]
}

say "1) Patch CronJob to ${IMG_PRIMARY}"
patch_cj_image "$IMG_PRIMARY"

say "2) Run job with ${IMG_PRIMARY}"
if run_job_once; then
  say "Rotate job completed with ${IMG_PRIMARY} ✅"
  exit 0
fi

say "3) Fallback: patch CronJob to ${IMG_FALLBACK} and retry"
patch_cj_image "$IMG_FALLBACK"
if run_job_once; then
  say "Rotate job completed with ${IMG_FALLBACK} ✅"
  exit 0
else
  say "Rotate still failing — showing recent namespace events"
  kubectl -n "$NS" get events --sort-by=.lastTimestamp | tail -n 80 || true
  exit 1
fi
