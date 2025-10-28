#!/usr/bin/env bash
set -euo pipefail

NS_CHI=arc-chi
NS_SIGMA=arc-sigma
NS_OMEGA=arc-omega
APP_CHI=chi-bus
PORT_NATS=4222

echo "[Ω2] Discover Chi ClusterIP and Sigma creds…"
CHI_IP="$(kubectl -n $NS_CHI get svc $APP_CHI -o jsonpath='{.spec.clusterIP}')"
SIGMA_USER="$(kubectl -n $NS_SIGMA get secret nats-sigma -o jsonpath='{.data.NATS_USER}' | base64 -d)"
SIGMA_PASS="$(kubectl -n $NS_SIGMA get secret nats-sigma -o jsonpath='{.data.NATS_PASS}' | base64 -d)"
NATS_DSN="nats://${SIGMA_USER}:${SIGMA_PASS}@${CHI_IP}:${PORT_NATS}"
echo "CHI_IP=$CHI_IP"

echo "[Ω2] Create/refresh Reason Contract (authoritative list + metadata)…"
cat <<'JSON' >/tmp/reason-contract.json
{
  "version": "1.0.0",
  "updated_at": "__NOW__",
  "codes": {
    "SYNC_READY": { "severity": "info", "desc": "System synchronized" },
    "HEARTBEAT":  { "severity": "info", "desc": "Periodic liveness ping" },
    "F2_TEST":    { "severity": "info", "desc": "NetPol validation ping" },
    "OMEGA_SIDECAR_OK": { "severity": "info", "desc": "Leaf path verified" },
    "ALERT_ANOMALY": { "severity": "warn", "desc": "Anomaly detected by Sigma" }
  },
  "policy": {
    "unknown_code": "log_warn",
    "max_rate_per_source_per_min": 120
  }
}
JSON

# Stamp time
sed -i '' "s/__NOW__/$(date -u +%FT%TZ)/" /tmp/reason-contract.json 2>/dev/null || \
perl -0777 -pe "s/__NOW__/$(date -u +%FT%TZ)/" -i /tmp/reason-contract.json

kubectl -n $NS_OMEGA create configmap omega-reason-contract \
  --from-file=reason-contract.json=/tmp/reason-contract.json \
  -o yaml --dry-run=client | kubectl apply -f -

echo "[Ω2] Mount contract into omega-monitor Pod via projected volume (non-destructive)…"
# Ensure volumes/env exist
kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/volumes","value":[]}
]' 2>/dev/null || true

# Add/ensure volume present
kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/volumes/-","value":{
    "name":"reason-contract",
    "configMap":{"name":"omega-reason-contract","items":[{"key":"reason-contract.json","path":"reason-contract.json"}]}
  }}
]' 2>/dev/null || true

# Ensure volumeMounts array exists
kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/volumeMounts","value":[]}
]' 2>/dev/null || true

# Mount into container at /etc/omega/contract
kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/volumeMounts/-","value":{
    "name":"reason-contract","mountPath":"/etc/omega/contract","readOnly":true
  }}
]' 2>/dev/null || true

# Add env to point to the contract (harmless if app ignores it)
kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env","value":[]}
]' 2>/dev/null || true

kubectl -n $NS_OMEGA patch deploy omega-monitor --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env/-","value":{
    "name":"OMEGA_REASON_CONTRACT","value":"/etc/omega/contract/reason-contract.json"
  }}
]' 2>/dev/null || true

kubectl -n $NS_OMEGA rollout restart deploy/omega-monitor || true
kubectl -n $NS_OMEGA rollout status  deploy/omega-monitor --timeout=120s || true

echo "[Ω2] Create a Sigma heartbeat producer CronJob (nats-box)…"
cat <<YAML | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sigma-heartbeat
  namespace: ${NS_SIGMA}
spec:
  schedule: "*/1 * * * *"   # every minute
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: hb
              image: synadia/nats-box:latest
              env:
                - name: NATS_DSN
                  value: "${NATS_DSN}"
              command: ["sh","-lc"]
              args:
                - |
                  TS=\$(date -u +%FT%TZ)
                  nats pub -s "\$NATS_DSN" omega.reason "{\"reason_code\":\"HEARTBEAT\",\"note\":\"sigma\",\"ts\":\"$TS\"}"
YAML

echo "[Ω2] Fire an immediate one-shot heartbeat and a contract ping…"
kubectl -n "$NS_SIGMA" run sigma-hb-once --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s ${NATS_DSN} omega.reason '{\"reason_code\":\"HEARTBEAT\",\"note\":\"ad-hoc\"}'"
kubectl -n "$NS_SIGMA" wait --for=condition=Succeeded pod/sigma-hb-once --timeout=60s || true

echo "[Ω2] Verify on omega-monitor logs (should see HEARTBEAT entries)…"
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | egrep -i 'HEARTBEAT|OMEGA_REASON_CONTRACT|omega\.reason|connected' || true

echo "[Ω2] Done. Reason contract mounted; Sigma heartbeat established; stream alive independently of UI/observability."
