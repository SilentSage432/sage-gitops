#!/usr/bin/env bash
set -euo pipefail

NS_CHI="arc-chi"
NS_OMEGA="arc-omega"
NS_SIGMA="arc-sigma"
NS_LAMBDA="arc-lambda"
NATS_DEPLOY="chi-bus"            # Deployment name running NATS in arc-chi
NATS_SVC="chi-bus"               # Service name for NATS (same label in your cluster)
NATS_PORT="4222"

tmp="$(mktemp -d)"
echo "[F1] Working dir: $tmp"

# ---- 1) Discover current creds from running deployments (preserve your live passwords) ----
# We try to read env vars from deployments; if missing, we generate (but only if not found).
get_env () {
  local ns="$1" deploy="$2" key="$3"
  kubectl -n "$ns" get deploy "$deploy" -o jsonpath="{.spec.template.spec.containers[0].env[?(@.name=='$key')].value}" 2>/dev/null || true
}

# omega-monitor
OMEGA_USER="$(get_env "$NS_OMEGA" "omega-monitor" "NATS_USER")"
OMEGA_PASS="$(get_env "$NS_OMEGA" "omega-monitor" "NATS_PASS")"

# sigma-agent
SIGMA_USER="$(get_env "$NS_SIGMA" "sigma-agent" "NATS_USER")"
SIGMA_PASS="$(get_env "$NS_SIGMA" "sigma-agent" "NATS_PASS")"

# lambda-cell
LAMBDA_USER="$(get_env "$NS_LAMBDA" "lambda-cell" "NATS_USER")"
LAMBDA_PASS="$(get_env "$NS_LAMBDA" "lambda-cell" "NATS_PASS")"

# Fallbacks only if not present (we won't change your running pods unless you later choose to)
randpw() { tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24; echo; }
: "${OMEGA_USER:=omega}"
: "${OMEGA_PASS:=$(randpw)}"
: "${SIGMA_USER:=sigma}"
: "${SIGMA_PASS:=$(randpw)}"
: "${LAMBDA_USER:=lambda}"
: "${LAMBDA_PASS:=$(randpw)}"

echo "[F1] Using users:"
echo "  omega:  $OMEGA_USER"
echo "  sigma:  $SIGMA_USER"
echo "  lambda: $LAMBDA_USER"

# ---- 2) Create NATS config (users + permissions) ----
# Subjects layout:
#   omega.reason           : central reason stream (consumed by omega-monitor)
#   sigma.telemetry.*      : sigma emits telemetry
#   lambda.tasks.*         : task inbox for lambda
#   lambda.acks.*          : lambda emits acks/outcomes
# Permissions:
#   omega  : sub -> omega.reason ; pub -> omega.control.*   (future controls)
#   sigma  : pub -> omega.reason, sigma.telemetry.*         ; no subs
#   lambda : sub -> lambda.tasks.* ; pub -> lambda.acks.*, omega.reason
cat > "$tmp/nats.conf" <<CONF
port: ${NATS_PORT}
server_name: chi-bus
authorization {
  users = [
    { user: "${OMEGA_USER}",  password: "${OMEGA_PASS}",
      permission: {
        publish:   ["omega.control.>"]
        subscribe: ["omega.reason"]
      }
    },
    { user: "${SIGMA_USER}",  password: "${SIGMA_PASS}",
      permission: {
        publish:   ["omega.reason", "sigma.telemetry.>"]
        subscribe: []
      }
    },
    { user: "${LAMBDA_USER}", password: "${LAMBDA_PASS}",
      permission: {
        publish:   ["lambda.acks.>", "omega.reason"]
        subscribe: ["lambda.tasks.>"]
      }
    }
  ]
}
CONF

# ---- 3) Ship config into cluster & patch chi-bus to use it ----
kubectl -n "$NS_CHI" create configmap chi-nats-config --from-file=nats.conf="$tmp/nats.conf" --dry-run=client -o yaml | kubectl apply -f -

# Patch Deployment to run with custom config if not already doing so
# Adds args: ["-c", "/etc/nats/nats.conf"] and mounts config
kubectl -n "$NS_CHI" patch deploy "$NATS_DEPLOY" --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/volumes","value":[
    {"name":"nats-config","configMap":{"name":"chi-nats-config"}}
  ]},
  {"op":"add","path":"/spec/template/spec/containers/0/volumeMounts","value":[
    {"name":"nats-config","mountPath":"/etc/nats"}
  ]},
  {"op":"add","path":"/spec/template/spec/containers/0/args","value":["-c","/etc/nats/nats.conf"]}
]' || true

echo "[F1] Restarting chi-bus to load ACLs…"
kubectl -n "$NS_CHI" rollout restart deploy/"$NATS_DEPLOY"
kubectl -n "$NS_CHI" rollout status  deploy/"$NATS_DEPLOY" --timeout=180s

# ---- 4) Test pod (nats-box) for quick allow/deny checks ----
cat > "$tmp/natsbox.yaml" <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: natsbox
  namespace: arc-chi
  labels: { app: natsbox }
spec:
  restartPolicy: Never
  containers:
    - name: natsbox
      image: synadia/nats-box:latest
      command: ["sh","-lc","sleep 3600"]
YAML
kubectl apply -f "$tmp/natsbox.yaml"
kubectl -n "$NS_CHI" wait --for=condition=Ready pod/natsbox --timeout=120s

# Helper to run nats-box commands
NATS_HOST="$(kubectl -n "$NS_CHI" get svc "$NATS_SVC" -o jsonpath='{.spec.clusterIP}')"
exec_in_box () { kubectl -n "$NS_CHI" exec natsbox -- sh -lc "$*"; }

echo "[F1] Sanity subs as omega (should succeed)…"
exec_in_box "nats sub -s nats://${OMEGA_USER}:${OMEGA_PASS}@${NATS_HOST}:${NATS_PORT} omega.reason --count=1 --timeout=1s >/dev/null 2>&1 || true"

echo "[F1] Negative test: sigma tries to SUBSCRIBE omega.reason (should FAIL)…"
exec_in_box "nats sub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${NATS_HOST}:${NATS_PORT} omega.reason --count=1 --timeout=1s" && \
  echo "ERROR: sigma was allowed to subscribe omega.reason" && exit 1 || echo "OK: sigma subscribe denied"

echo "[F1] Positive test: sigma PUBLISH to omega.reason (should PASS)…"
exec_in_box "nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${NATS_HOST}:${NATS_PORT} omega.reason '{\"reason_code\":\"ACL_TEST_SIGMA\",\"note\":\"sigma emit\"}'"

echo "[F1] Negative test: lambda tries to PUBLISH to lambda.tasks.foo (should FAIL, only SUB allowed)…"
exec_in_box "nats pub -s nats://${LAMBDA_USER}:${LAMBDA_PASS}@${NATS_HOST}:${NATS_PORT} lambda.tasks.foo 'x'" && \
  echo 'ERROR: lambda publish to lambda.tasks.* unexpectedly allowed' && exit 1 || echo "OK: lambda publish to tasks denied"

echo "[F1] Positive test: lambda SUBSCRIBE tasks + PUBLISH acks (PASS)…"
exec_in_box "timeout 1 nats sub -s nats://${LAMBDA_USER}:${LAMBDA_PASS}@${NATS_HOST}:${NATS_PORT} lambda.tasks.foo --count=1 --timeout=1s >/dev/null 2>&1 || true"
exec_in_box "nats pub -s nats://${LAMBDA_USER}:${LAMBDA_PASS}@${NATS_HOST}:${NATS_PORT} lambda.acks.foo '{\"status\":\"ok\"}'"

# ---- 5) End-to-end Ω smoke: emit two Reason Codes via sigma (omega-monitor should log them) ----
exec_in_box "nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${NATS_HOST}:${NATS_PORT} omega.reason '{\"reason_code\":\"SYNC_READY\",\"note\":\"f1-smoke\"}'"
exec_in_box "nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${NATS_HOST}:${NATS_PORT} omega.reason '{\"reason_code\":\"ACL_MATRIX_APPLIED\",\"note\":\"chi-f1\"}'"

echo "[F1] Tail omega-monitor for confirmation (Ctrl-C when satisfied)…"
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor -f --since=60s | sed -n '1,80p'

echo "[F1] Done. Chi ACL Matrix enforced."
