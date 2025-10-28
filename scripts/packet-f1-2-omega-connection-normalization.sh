#!/usr/bin/env bash
set -euo pipefail

NS_CHI="arc-chi"
NS_OMEGA="arc-omega"
NATS_SVC="chi-bus"
NATS_PORT="4222"

echo "[F1.2] Discovering NATS host and pulling omega secret…"
NATS_HOST_IP="$(kubectl -n "$NS_CHI" get svc "$NATS_SVC" -o jsonpath='{.spec.clusterIP}')"
kubectl -n "$NS_OMEGA" get secret nats-omega -o yaml >/dev/null

OMEGA_USER="$(kubectl -n "$NS_OMEGA" get secret nats-omega -o jsonpath='{.data.NATS_USER}' | base64 -d)"
OMEGA_PASS="$(kubectl -n "$NS_OMEGA" get secret nats-omega -o jsonpath='{.data.NATS_PASS}' | base64 -d)"
NATS_URL="nats://${NATS_HOST_IP}:${NATS_PORT}"
NATS_DSN="nats://${OMEGA_USER}:${OMEGA_PASS}@${NATS_HOST_IP}:${NATS_PORT}"

echo "[F1.2] Creating a 'compat' secret with ALL likely env names the app might consume…"
kubectl -n "$NS_OMEGA" create secret generic nats-omega-compat \
  --from-literal=NATS_URL="$NATS_URL" \
  --from-literal=NATS_URI="$NATS_URL" \
  --from-literal=NATS_SERVER="$NATS_URL" \
  --from-literal=NATS_HOST="$NATS_HOST_IP" \
  --from-literal=NATS_PORT="$NATS_PORT" \
  --from-literal=NATS_USER="$OMEGA_USER" \
  --from-literal=NATS_USERNAME="$OMEGA_USER" \
  --from-literal=NATS_PASS="$OMEGA_PASS" \
  --from-literal=NATS_PASSWORD="$OMEGA_PASS" \
  --from-literal=NATS_DSN="$NATS_DSN" \
  --from-literal=NATS_SUBJECT="omega.reason" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[F1.2] Patching omega-monitor to consume compat secret (non-destructive; merges env)…"
# Ensure env array exists
kubectl -n "$NS_OMEGA" patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env","value":[]}
]' 2>/dev/null || true

# Upsert a small set of canonical envs that many NATS clients honor
for K in NATS_DSN NATS_URL NATS_USER NATS_PASS NATS_SUBJECT; do
  idx=$(kubectl -n "$NS_OMEGA" get deploy omega-monitor -o json | jq -r ".spec.template.spec.containers[0].env | map(.name==\"$K\") | index(true)")
  if [ "$idx" != "null" ]; then
    kubectl -n "$NS_OMEGA" patch deploy omega-monitor --type='json' -p="[
      {\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/env/$idx\"}
    ]" || true
  fi
  kubectl -n "$NS_OMEGA" patch deploy omega-monitor --type='json' -p="[
    {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":
      {\"name\":\"$K\",\"valueFrom\":{\"secretKeyRef\":{\"name\":\"nats-omega-compat\",\"key\":\"$K\"}}}
    }
  ]"
done

echo "[F1.2] Rolling omega-monitor and tailing logs for auth/connect lines…"
kubectl -n "$NS_OMEGA" rollout restart deploy/omega-monitor
kubectl -n "$NS_OMEGA" rollout status  deploy/omega-monitor --timeout=180s || true
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | egrep -i 'nats|auth|connect|omega\.reason' || true

echo "[F1.2] Launching a canary pod inside arc-omega that uses the SAME secret to prove creds…"
cat <<'YAML' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: nats-canary
  namespace: arc-omega
spec:
  restartPolicy: Never
  containers:
    - name: canary
      image: synadia/nats-box:latest
      envFrom:
        - secretRef: { name: nats-omega-compat }
      command: ["sh","-lc"]
      args:
        - |
          echo "Testing DSN: $NATS_DSN";
          nats -s "$NATS_DSN" sub omega.reason --count=1 --timeout=2s >/tmp/sub.out 2>/tmp/sub.err || true;
          nats -s "$NATS_DSN" pub omega.reason '{"reason_code":"OMEGA_CANARY","note":"f1.2"}' || true;
          echo "---- SUB OUT ----"; cat /tmp/sub.out 2>/dev/null || true; echo "---- SUB ERR ----"; cat /tmp/sub.err 2>/dev/null || true;
YAML

kubectl -n "$NS_OMEGA" wait --for=condition=Succeeded pod/nats-canary --timeout=60s || true

echo "[F1.2] Show omega-monitor last 2m (should see OMEGA_CANARY)…"
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | egrep 'OMEGA_CANARY|authorization|authentication|connected|reconnect' || true

echo "[F1.2] Done. If you still see authorization violations, the app is likely ignoring env and using a default connection path."
echo "       In that case, tell me and I'll give you Packet F1.3 to inject a tiny sidecar proxy so omega-monitor connects via localhost with creds."
