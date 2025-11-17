#!/usr/bin/env bash
set -euo pipefail
NS="arc-rho2"
CJ="rho2-rotate"
IMG="bitnami/kubectl:latest"   # working tag that pulled on your node

bold(){ printf "\n\033[1m%s\033[0m\n" "$*"; }

bold "1) Detect rotate script name from ConfigMap rho2-rotation"
# Pick *.sh key if present, else first key
SCRIPT="$(kubectl -n "$NS" get cm rho2-rotation -o json | jq -r '.data | keys[] | select(test("\\.sh$"))' | head -n1 || true)"
if [[ -z "${SCRIPT:-}" || "${SCRIPT:-null}" == "null" ]]; then
  SCRIPT="$(kubectl -n "$NS" get cm rho2-rotation -o json | jq -r '.data | keys[0]' || true)"
fi
if [[ -z "${SCRIPT:-}" || "${SCRIPT:-null}" == "null" ]]; then
  echo "❌ No keys found in ConfigMap rho2-rotation"; exit 2
fi
echo "Rotate script key: $SCRIPT"

bold "2) Patch CronJob with restricted PodSecurity, writable /tmp, work mount, and robust command"
kubectl -n "$NS" get cronjob "$CJ" -o json \
| jq --arg img "$IMG" --arg script "$SCRIPT" '
  .spec.jobTemplate.spec.template.spec.imagePullSecrets = [] |
  .spec.jobTemplate.spec.template.spec.securityContext = {runAsNonRoot:true, seccompProfile:{type:"RuntimeDefault"}} |
  .spec.jobTemplate.spec.template.spec.tolerations = [
    {key:"node-role.kubernetes.io/control-plane",operator:"Exists",effect:"NoSchedule"},
    {key:"node-role.kubernetes.io/master",operator:"Exists",effect:"NoSchedule"}
  ] |
  .spec.jobTemplate.spec.template.spec.volumes = [
    {name:"tmp", emptyDir:{}},
    {name:"work", configMap:{name:"rho2-rotation"}}
  ] |
  # ensure containers exists and update/create "rotator"
  (if .spec.jobTemplate.spec.template.spec.containers then . else
    (.spec.jobTemplate.spec.template.spec.containers = []) end) |
  (.spec.jobTemplate.spec.template.spec.containers) |=
    (map(if .name=="rotator" then
      .image = $img |
      .imagePullPolicy = "IfNotPresent" |
      .terminationMessagePolicy = "FallbackToLogsOnError" |
      .env = [{name:"HOME", value:"/tmp"}] |
      .volumeMounts = [{name:"tmp", mountPath:"/tmp"}, {name:"work", mountPath:"/work"}] |
      .securityContext = {allowPrivilegeEscalation:false, readOnlyRootFilesystem:true, runAsNonRoot:true, capabilities:{drop:["ALL"]}} |
      .command = ["/bin/sh","-lc","test -f /work/\($script) && /bin/sh /work/\($script) || (echo \"rotate script not found; showing /work:\"; ls -la /work; exit 1)"]
     else . end)
    # if no "rotator" existed, append one
    | if (map(.name)|index("rotator")) == null then
        . + [{
          name:"rotator",
          image:$img,
          imagePullPolicy:"IfNotPresent",
          terminationMessagePolicy:"FallbackToLogsOnError",
          env:[{name:"HOME", value:"/tmp"}],
          volumeMounts:[{name:"tmp", mountPath:"/tmp"}, {name:"work", mountPath:"/work"}],
          securityContext:{allowPrivilegeEscalation:false, readOnlyRootFilesystem:true, runAsNonRoot:true, capabilities:{drop:["ALL"]}},
          command:["/bin/sh","-lc","test -f /work/\($script) && /bin/sh /work/\($script) || (echo \"rotate script not found; showing /work:\"; ls -la /work; exit 1)"]
        }]
      else .
      end
    )
' \
| kubectl apply -f -

bold "3) Delete previous rotate Jobs and trigger a fresh run"
for j in $(kubectl -n "$NS" get jobs -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' | grep "^${CJ}-" || true); do
  kubectl -n "$NS" delete job "$j" --ignore-not-found >/dev/null 2>&1 || true
done
JOB="${CJ}-manual-$(date +%s)"
kubectl -n "$NS" create job --from=cronjob/"$CJ" "$JOB" >/dev/null
echo "Job: $JOB"

bold "4) Wait for pod → logs → wait for Succeeded"
# wait pod name
for i in {1..60}; do
  POD="$(kubectl -n "$NS" get pods -l job-name="$JOB" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "${POD:-}" ]] && break || sleep 1
done
[[ -z "${POD:-}" ]] && { echo "No pod created for $JOB"; kubectl -n "$NS" describe job "$JOB"; exit 3; }
echo "Pod: $POD"

# early describe if waiting on pulls
STATE="$(kubectl -n "$NS" get pod "$POD" -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || true)"
if [[ "${STATE:-}" == "ErrImagePull" || "${STATE:-}" == "ImagePullBackOff" ]]; then
  kubectl -n "$NS" describe pod "$POD" | sed -n '1,180p'
fi

# stream logs (non-fatal if short)
kubectl -n "$NS" logs -f "$POD" || true

# wait for Succeeded with timeout
for i in {1..60}; do
  SUC="$(kubectl -n "$NS" get job "$JOB" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo 0)"
  [[ "$SUC" == "1" ]] && break || sleep 2
done

bold "5) Final status"
kubectl -n "$NS" get pods -l job-name="$JOB" -o wide
kubectl -n "$NS" get job "$JOB" -o wide
if [[ "$SUC" == "1" ]]; then
  echo "✅ rho2-rotate Completed"
  exit 0
else
  echo "❌ rho2-rotate did not complete — showing describe"
  kubectl -n "$NS" describe job "$JOB" | sed -n '1,200p'
  exit 4
fi
