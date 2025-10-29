#!/usr/bin/env bash
set -euo pipefail

NS=arc-omega
DEP=omega-monitor
CM=reason-contract

echo "[Ω3] Ensure ConfigMap '${CM}' exists (with reason-contract.json)…"
kubectl -n "${NS}" create configmap "${CM}" --dry-run=client -o yaml \
  | kubectl apply -f -

# If you already have a JSON file in repo, replace the inline step with:
# kubectl -n "${NS}" create configmap "${CM}" --from-file=reason-contract.json=kubernetes/arc-omega/reason-contract.json --dry-run=client -o yaml | kubectl apply -f -

echo "[Ω3] Patch volumes (merge-add reason-contract + tmp)…"
kubectl -n "${NS}" patch deploy/${DEP} --type merge -p '{
  "spec": { "template": { "spec": {
    "volumes": [
      {
        "name": "reason-contract",
        "configMap": {
          "name": "reason-contract",
          "items": [
            { "key": "reason-contract.json", "path": "reason-contract.json" }
          ]
        }
      },
      { "name": "tmp", "emptyDir": {} }
    ]
  } } }
}'

echo "[Ω3] Patch monitor container to mount /etc/omega and /tmp, and expose metrics port…"
kubectl -n "${NS}" patch deploy/${DEP} --type merge -p '{
  "spec": { "template": { "spec": {
    "containers": [
      {
        "name": "monitor",
        "volumeMounts": [
          { "name": "reason-contract", "mountPath": "/etc/omega", "readOnly": true },
          { "name": "tmp", "mountPath": "/tmp" }
        ],
        "ports": [
          { "name": "metrics", "containerPort": 8081, "protocol": "TCP" }
        ]
      }
    ]
  } } }
}'

echo "[Ω3] Ensure required env vars are set exactly once…"
kubectl -n "${NS}" set env deploy/${DEP} REASON_CONTRACT_PATH=/etc/omega/reason-contract.json METRICS_PORT=8081

echo "[Ω3] (Optional) Create metrics Service if missing…"
kubectl -n "${NS}" get svc omega-monitor-metrics >/dev/null 2>&1 || kubectl -n "${NS}" apply -f - <<'YAML'
apiVersion: v1
kind: Service
metadata:
  name: omega-monitor-metrics
  namespace: arc-omega
spec:
  selector:
    app: omega-monitor
  ports:
    - name: metrics
      port: 8081
      targetPort: 8081
      protocol: TCP
YAML

echo "[Ω3] Restart omega-monitor to pick everything up…"
kubectl -n "${NS}" rollout restart deploy/${DEP}
kubectl -n "${NS}" rollout status  deploy/${DEP} --timeout=180s || true

echo "[Ω3] Quick verification:"
echo " - Recent omega-monitor logs (look for HEARTBEAT and no crash loops)…"
kubectl -n "${NS}" logs deploy/${DEP} --since=2m | tail || true

echo " - Metrics endpoint (inside cluster)…"
kubectl -n "${NS}" run curlz --restart=Never --image=curlimages/curl:8.10.1 --rm -it -- \
  curl -sf http://omega-monitor-metrics.${NS}.svc.cluster.local:8081/metrics \
  | grep -E 'omega_unknown_reason_total|^#' | head -n 10 || true
