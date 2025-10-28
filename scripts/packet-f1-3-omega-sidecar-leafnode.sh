#!/usr/bin/env bash
set -euo pipefail

NS_CHI="arc-chi"
NS_OMEGA="arc-omega"
NATS_SVC="chi-bus"
NATS_PORT="4222"
DEPLOY="omega-monitor"

echo "[F1.3] Discovering Chi service and omega creds…"
NATS_HOST_IP="$(kubectl -n "$NS_CHI" get svc "$NATS_SVC" -o jsonpath='{.spec.clusterIP}')"
OMEGA_USER="$(kubectl -n "$NS_OMEGA" get secret nats-omega -o jsonpath='{.data.NATS_USER}' | base64 -d)"
OMEGA_PASS="$(kubectl -n "$NS_OMEGA" get secret nats-omega -o jsonpath='{.data.NATS_PASS}' | base64 -d)"

# Prefer stable DNS name; fall back to ClusterIP if DNS is problematic.
UPSTREAM_ADDR="${NATS_SVC}.${NS_CHI}.svc.cluster.local:${NATS_PORT}"

echo "[F1.3] Creating leafnode config (sidecar listens on 4222 locally; remotes -> Chi with auth)…"
cat > /tmp/omega-leaf.conf <<CONF
# Local listener that omega-monitor will connect to via chi-bus -> 127.0.0.1
port: 4222
server_name: omega-leaf

# Keep local open (no auth) since only same-pod access via hostAliases
authorization {
  # no users -> open listener for local pod only
}

leafnodes {
  remotes: [
    { url: "nats://${OMEGA_USER}:${OMEGA_PASS}@${UPSTREAM_ADDR}" }
  ]
}
CONF

kubectl -n "$NS_OMEGA" create configmap omega-leaf-config \
  --from-file=leaf.conf=/tmp/omega-leaf.conf \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[F1.3] Patching Deployment to add sidecar + config mount + hostAliases…"
# Build a JSON patch that:
#  - adds a volume for omega-leaf-config
#  - mounts it into a new 'nats-leaf' sidecar (nats:2.10.29-alpine)
#  - sets hostAliases so chi-bus resolves to 127.0.0.1 for this Pod
PATCH="$(cat <<'JSON'
[
  {"op":"add","path":"/spec/template/spec/volumes","value":[
    {"name":"omega-leaf-config","configMap":{"name":"omega-leaf-config"}}
  ]},
  {"op":"add","path":"/spec/template/spec/containers/-","value":{
    "name":"nats-leaf",
    "image":"nats:2.10.29-alpine",
    "args":["-c","/etc/nats/leaf.conf"],
    "ports":[{"containerPort":4222,"name":"leaf"}],
    "volumeMounts":[{"name":"omega-leaf-config","mountPath":"/etc/nats"}],
    "readinessProbe":{
      "exec":{"command":["sh","-lc","nats --version >/dev/null 2>&1 || true; nc -z 127.0.0.1 4222"]},
      "initialDelaySeconds":2,"periodSeconds":5,"failureThreshold":12
    },
    "livenessProbe":{
      "exec":{"command":["sh","-lc","nc -z 127.0.0.1 4222"]},
      "initialDelaySeconds":10,"periodSeconds":10,"failureThreshold":6
    }
  }},
  {"op":"add","path":"/spec/template/spec/hostAliases","value":[
    {"ip":"127.0.0.1","hostnames":["chi-bus","chi-bus.arc-chi.svc","chi-bus.arc-chi.svc.cluster.local"]}
  ]}
]
JSON
)"

kubectl -n "$NS_OMEGA" patch deploy "$DEPLOY" --type='json' -p="$PATCH" || {
  echo "Patch failed—attempting idempotent merge for volumes/hostAliases and appending sidecar…"
  # Ensure arrays exist, then append (covers cases where arrays already present)
  kubectl -n "$NS_OMEGA" patch deploy "$DEPLOY" --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/volumes","value":[]}
  ]' 2>/dev/null || true
  kubectl -n "$NS_OMEGA" patch deploy "$DEPLOY" --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/hostAliases","value":[]}
  ]' 2>/dev/null || true
  kubectl -n "$NS_OMEGA" patch deploy "$DEPLOY" --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/volumes/-","value":{"name":"omega-leaf-config","configMap":{"name":"omega-leaf-config"}}},
    {"op":"add","path":"/spec/template/spec/containers/-","value":{
      "name":"nats-leaf",
      "image":"nats:2.10.29-alpine",
      "args":["-c","/etc/nats/leaf.conf"],
      "ports":[{"containerPort":4222,"name":"leaf"}],
      "volumeMounts":[{"name":"omega-leaf-config","mountPath":"/etc/nats"}]
    }},
    {"op":"add","path":"/spec/template/spec/hostAliases/-","value":{"ip":"127.0.0.1","hostnames":["chi-bus","chi-bus.arc-chi.svc","chi-bus.arc-chi.svc.cluster.local"]}}
  ]'
}

echo "[F1.3] Rolling deployment…"
kubectl -n "$NS_OMEGA" rollout restart deploy/"$DEPLOY"
kubectl -n "$NS_OMEGA" rollout status  deploy/"$DEPLOY" --timeout=240s || true

echo "[F1.3] Sidecar logs (first 60 lines)…"
kubectl -n "$NS_OMEGA" logs deploy/"$DEPLOY" -c nats-leaf --since=3m | sed -n '1,60p' || true

echo "[F1.3] Publish a test Reason via sigma to confirm omega-monitor now receives via sidecar…"
NATS_URL_CLUSTER="nats://${NATS_HOST_IP}:${NATS_PORT}"
kubectl -n "$NS_CHI" run natsbox-f13 --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s ${NATS_URL_CLUSTER} omega.reason '{\"reason_code\":\"OMEGA_SIDECAR_OK\",\"note\":\"f1.3\"}'" || true
kubectl -n "$NS_CHI" wait --for=condition=Succeeded pod/natsbox-f13 --timeout=60s || true

echo "[F1.3] Omega-monitor last 2m (should show OMEGA_SIDECAR_OK, and NO auth violations)…"
kubectl -n "$NS_OMEGA" logs deploy/"$DEPLOY" --since=2m | egrep -i 'OMEGA_SIDECAR_OK|authorization|authentication|connected|reconnect' || true

echo "[F1.3] Done. Omega now connects to local leafnode on 4222; leaf authenticates to Chi."
