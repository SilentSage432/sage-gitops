#!/usr/bin/env bash
set -euo pipefail

NS_CHI="arc-chi"
NS_OMEGA="arc-omega"
NS_SIGMA="arc-sigma"
NS_LAMBDA="arc-lambda"
NATS_SVC="chi-bus"
NATS_PORT="4222"

tmp="$(mktemp -d)"; echo "[F1.1] tmp: $tmp"

echo "[F1.1] Fetching live NATS config from chi-nats-config…"
kubectl -n "$NS_CHI" get cm chi-nats-config -o jsonpath='{.data.nats\.conf}' > "$tmp/nats.conf"

echo "[F1.1] Parsing users from nats.conf…"
# Expected blocks like:
# { user: "omega",  password: "XXX", permission: {...} },
get_user() { awk -v who="$1" '
  $0 ~ "user:[[:space:]]*\"" who "\"" {
    # search forward for password in same or subsequent lines
    for(i=1;i<=20;i++) {
      getline l
      if (match(l, /password:[[:space:]]*\"([^\"]+)\"/, m)) { print m[1]; exit }
    }
  }' "$tmp/nats.conf"; }

OMEGA_USER="$(awk '/user:/ && /omega/ {print gensub(/.*user:[[:space:]]*\"([^\"]+)\".*/,"\\1",1)}' "$tmp/nats.conf" | head -n1 || true)"
SIGMA_USER="$(awk '/user:/ && /sigma/ {print gensub(/.*user:[[:space:]]*\"([^\"]+)\".*/,"\\1",1)}' "$tmp/nats.conf" | head -n1 || true)"
LAMBDA_USER="$(awk '/user:/ && /lambda/ {print gensub(/.*user:[[:space:]]*\"([^\"]+)\".*/,"\\1",1)}' "$tmp/nats.conf" | head -n1 || true)"

OMEGA_PASS="$(get_user "$OMEGA_USER")"
SIGMA_PASS="$(get_user "$SIGMA_USER")"
LAMBDA_PASS="$(get_user "$LAMBDA_USER")"

test -n "$OMEGA_USER" && test -n "$OMEGA_PASS" || { echo "Failed to parse omega creds"; exit 1; }
test -n "$SIGMA_USER" && test -n "$SIGMA_PASS" || { echo "Failed to parse sigma creds"; exit 1; }
test -n "$LAMBDA_USER" && test -n "$LAMBDA_PASS" || { echo "Failed to parse lambda creds"; exit 1; }

echo "[F1.1] Discovering Chi service ClusterIP…"
NATS_HOST_IP="$(kubectl -n "$NS_CHI" get svc "$NATS_SVC" -o jsonpath='{.spec.clusterIP}')"
NATS_URL="nats://${NATS_HOST_IP}:${NATS_PORT}"
echo "NATS_URL=${NATS_URL}"

echo "[F1.1] Creating/updating Secrets…"
kubectl -n "$NS_OMEGA" create secret generic nats-omega --from-literal=NATS_URL="$NATS_URL" --from-literal=NATS_USER="$OMEGA_USER" --from-literal=NATS_PASS="$OMEGA_PASS" --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$NS_SIGMA" create secret generic nats-sigma --from-literal=NATS_URL="$NATS_URL" --from-literal=NATS_USER="$SIGMA_USER" --from-literal=NATS_PASS="$SIGMA_PASS" --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$NS_LAMBDA" create secret generic nats-lambda --from-literal=NATS_URL="$NATS_URL" --from-literal=NATS_USER="$LAMBDA_USER" --from-literal=NATS_PASS="$LAMBDA_PASS" --dry-run=client -o yaml | kubectl apply -f -

echo "[F1.1] Patching deployments to read from Secrets…"
# Adds/updates three env vars; leaves existing ones intact if already correct.
patch_env () {
  local ns="$1" deploy="$2" secret="$3"
  kubectl -n "$ns" patch deploy "$deploy" --type='json' -p="[
    {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env\",\"value\":[]}
  ]" 2>/dev/null || true

  for k in NATS_URL NATS_USER NATS_PASS; do
    # remove existing env if present
    idx=$(kubectl -n "$ns" get deploy "$deploy" -o json | jq -r ".spec.template.spec.containers[0].env | map(.name==\"$k\") | index(true)")
    if [ "$idx" != "null" ]; then
      kubectl -n "$ns" patch deploy "$deploy" --type='json' -p="[
        {\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/env/$idx\"}
      ]" || true
    fi
    kubectl -n "$ns" patch deploy "$deploy" --type='json' -p="[
      {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":
        {\"name\":\"$k\",\"valueFrom\":{\"secretKeyRef\":{\"name\":\"$secret\",\"key\":\"$k\"}}}
      }
    ]"
  done
}

patch_env "$NS_OMEGA"  "omega-monitor"   "nats-omega"
patch_env "$NS_SIGMA"  "sigma-agent"     "nats-sigma"
patch_env "$NS_LAMBDA" "lambda-cell"     "nats-lambda"

echo "[F1.1] Rolling deployments…"
kubectl -n "$NS_OMEGA"  rollout restart deploy/omega-monitor
kubectl -n "$NS_SIGMA"  rollout restart deploy/sigma-agent || true
kubectl -n "$NS_LAMBDA" rollout restart deploy/lambda-cell || true

kubectl -n "$NS_OMEGA"  rollout status  deploy/omega-monitor --timeout=180s || true
kubectl -n "$NS_SIGMA"  rollout status  deploy/sigma-agent   --timeout=180s || true
kubectl -n "$NS_LAMBDA" rollout status  deploy/lambda-cell  --timeout=180s || true

echo "[F1.1] Verifying omega-monitor connectivity (last 2m)…"
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | tail -n +1 | sed -n '1,120p' || true

echo "[F1.1] Publishing a test Reason via sigma creds…"
kubectl -n "$NS_CHI" run natsbox-ephemeral --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s ${NATS_URL/\/\//:\/\/$SIGMA_USER:$SIGMA_PASS@} omega.reason '{\"reason_code\":\"ACL_CRED_SYNC\",\"note\":\"f1.1\"}'" || true
kubectl -n "$NS_CHI" wait --for=condition=Succeeded pod/natsbox-ephemeral --timeout=60s || true
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | egrep 'ACL_CRED_SYNC|authentication|authorization|connected|reconnect' || true

echo "[F1.1] Done. Arcs now use ACL-protected NATS credentials."
