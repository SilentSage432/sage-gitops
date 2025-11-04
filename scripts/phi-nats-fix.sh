#!/usr/bin/env bash

set -euo pipefail

PHI_NS=arc-phi
PHI_DEPLOY=phi-cortex

# 0) Discover the Cortex deployment (auto if name changes)
if ! kubectl -n "$PHI_NS" get deploy "$PHI_DEPLOY" >/dev/null 2>&1; then
  PHI_DEPLOY="$(kubectl -n "$PHI_NS" get deploy -o json \
    | jq -r '.items[] | select(.metadata.name|test("phi|cortex";"i")) | .metadata.name' | head -n1)"
fi
echo "Phi deployment: ${PHI_DEPLOY}"

# 1) Ensure phi creds exist (but localhost won’t actually need them)
if ! kubectl -n "$PHI_NS" get secret nats-phi >/dev/null 2>&1; then
  PHI_PASS="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)"
  kubectl -n "$PHI_NS" create secret generic nats-phi \
    --from-literal=NATS_USER=phi \
    --from-literal=NATS_PASS="$PHI_PASS"
fi

# 2) Leafnode config CM (sidecar points to Chi leaf; if you already created it, this is a no-op)
CHI_IP="$(kubectl -n arc-chi get svc -o json \
  | jq -r '.items[] | select((.spec.ports[]?.port==4222) or (.metadata.name|test("chi|nats";"i"))) | .spec.clusterIP' | head -n1)"

kubectl -n "$PHI_NS" apply -f - <<YAML
apiVersion: v1
kind: ConfigMap
metadata: { name: phi-leaf-config }
data:
  nats.conf: |
    port: 4222
    server_name: "phi-leaf"
    leafnodes {
      remotes: [
        { url: "nats://phi:$(kubectl -n $PHI_NS get secret nats-phi -o jsonpath='{.data.NATS_PASS}' | base64 -d)@${CHI_IP}:7422" }
      ]
    }
YAML

# 3) Hard-patch the Deployment to:
#    - add leafnode sidecar
#    - set NATS_URL=localhost on cortex
#    - drop omega creds env and ensure /tmp + data mounts
kubectl -n "$PHI_NS" patch deploy "$PHI_DEPLOY" --type='merge' -p "{
  \"spec\": { \"template\": { \"spec\": {
    \"volumes\": [
      {\"name\":\"tmp\",\"emptyDir\":{}},
      {\"name\":\"phi-data\",\"emptyDir\":{}},
      {\"name\":\"phi-leaf-config\",\"configMap\":{\"name\":\"phi-leaf-config\",\"items\":[{\"key\":\"nats.conf\",\"path\":\"nats.conf\"}]}}
    ],
    \"containers\": [
      {
        \"name\": \"cortex\",
        \"env\": [
          {\"name\":\"NATS_URL\",\"value\":\"nats://127.0.0.1:4222\"}
        ],
        \"volumeMounts\": [
          {\"name\":\"tmp\",\"mountPath\":\"/tmp\"},
          {\"name\":\"phi-data\",\"mountPath\":\"/var/lib/phi\"}
        ]
      },
      {
        \"name\": \"phi-leaf\",
        \"image\": \"nats:2.10-alpine\",
        \"args\": [\"-c\",\"/etc/nats/nats.conf\"],
        \"ports\": [{\"containerPort\":4222,\"name\":\"nats\"}],
        \"volumeMounts\": [{\"name\":\"phi-leaf-config\",\"mountPath\":\"/etc/nats\"}],
        \"securityContext\": {\"runAsNonRoot\":true, \"allowPrivilegeEscalation\":false, \"seccompProfile\":{\"type\":\"RuntimeDefault\"}, \"capabilities\":{\"drop\":[\"ALL\"]}},
        \"livenessProbe\":  {\"exec\":{\"command\":[\"sh\",\"-lc\",\"nc -z 127.0.0.1 4222 || exit 1\"]},\"initialDelaySeconds\":5,\"periodSeconds\":10},
        \"readinessProbe\": {\"exec\":{\"command\":[\"sh\",\"-lc\",\"nc -z 127.0.0.1 4222 || exit 1\"]},\"initialDelaySeconds\":3,\"periodSeconds\":10}
      }
    ]
  }}}}
"

# 3b) Remove any omega creds env on cortex if present (idempotent)
kubectl -n "$PHI_NS" patch deploy "$PHI_DEPLOY" --type=json -p='[
  {"op":"remove","path":"/spec/template/spec/containers/0/env/1"},
  {"op":"remove","path":"/spec/template/spec/containers/0/env/1"}
]' 2>/dev/null || true
# (We removed two slots to wipe NATS_USER/NATS_PASS if they exist; harmless if not.)

# 4) Rollout and quick checks
kubectl -n "$PHI_NS" rollout restart deploy/"$PHI_DEPLOY"
kubectl -n "$PHI_NS" rollout status  deploy/"$PHI_DEPLOY" --timeout=180s || true
POD=$(kubectl -n "$PHI_NS" get pod -l app=phi-cortex -o jsonpath='{.items[0].metadata.name}')
echo "Pod: $POD"
echo "[leaf ready?]"
kubectl -n "$PHI_NS" exec "$POD" -c phi-leaf -- sh -lc 'nc -z 127.0.0.1 4222 && echo OK || echo FAIL' || true
echo "[env in cortex]"
kubectl -n "$PHI_NS" exec "$POD" -c cortex -- sh -lc 'echo NATS_URL=$NATS_URL || true' || true
echo "[last cortex logs]"
kubectl -n "$PHI_NS" logs "$POD" -c cortex --tail=120 --timestamps || true
