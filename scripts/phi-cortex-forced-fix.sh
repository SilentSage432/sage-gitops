#!/usr/bin/env bash

set -euo pipefail

PHI_NS=arc-phi
PHI_DEPLOY=phi-cortex
CHI_NS=arc-chi

need(){ command -v "$1" >/dev/null || { echo "Missing $1"; exit 1; }; }
need kubectl
need python3
need jq
need base64

echo "== Discover Chi Service & leaf port =="
CHI_SVC="$(kubectl -n "$CHI_NS" get svc -o json \
  | jq -r '.items[] | select((.spec.ports[]?.port==4222) or (.metadata.name|test("chi|nats";"i"))) | .metadata.name' \
  | head -n1)"
[[ -n "${CHI_SVC:-}" ]] || { echo "Chi Service not found in $CHI_NS"; exit 1; }
CHI_IP="$(kubectl -n "$CHI_NS" get svc "$CHI_SVC" -o jsonpath='{.spec.clusterIP}')"
echo "Chi service: $CHI_SVC ($CHI_IP)"

# Ensure leaf :7422 is on the Service (idempotent)
kubectl -n "$CHI_NS" patch svc "$CHI_SVC" --type=json -p='[
  {"op":"add","path":"/spec/ports/-","value":{"name":"leaf","port":7422,"protocol":"TCP","targetPort":7422}}
]' 2>/dev/null || true

echo "== Ensure phi creds (for leaf auth) =="
if ! kubectl -n "$PHI_NS" get secret nats-phi >/dev/null 2>&1; then
  PHI_PASS="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)"
  kubectl -n "$PHI_NS" create secret generic nats-phi \
    --from-literal=NATS_USER=phi --from-literal=NATS_PASS="$PHI_PASS"
else
  PHI_PASS="$(kubectl -n "$PHI_NS" get secret nats-phi -o jsonpath='{.data.NATS_PASS}' | base64 -d)"
fi

echo "== Create/refresh phi-leaf-config CM =="
kubectl -n "$PHI_NS" apply -f - <<YAML
apiVersion: v1
kind: ConfigMap
metadata:
  name: phi-leaf-config
data:
  nats.conf: |
    port: 4222
    server_name: "phi-leaf"
    leafnodes {
      remotes: [
        { url: "nats://phi:${PHI_PASS}@${CHI_IP}:7422" }
      ]
    }
YAML

echo "== Export live Deployment =="
TMPDIR="$(mktemp -d)"
OUT="$TMPDIR/phi-cortex.fixed.yaml"
kubectl -n "$PHI_NS" get deploy "$PHI_DEPLOY" -o json > "$TMPDIR/deploy.json"

echo "== Rewrite spec.template (add sidecar, fix env/mounts/volumes) =="
python3 - "$TMPDIR/deploy.json" "$OUT" <<'PY'
import sys, json, copy, yaml
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))

spec = d["spec"]["template"]["spec"]
containers = spec.get("containers", [])
# Find cortex container
cortex = None
for c in containers:
    if c.get("name") == "cortex":
        cortex = c
        break
if cortex is None:
    raise SystemExit("cortex container not found")

# Ensure env: NATS_URL=localhost; remove NATS_USER/NATS_PASS
env = cortex.get("env", [])
def not_user_pass(e): return e.get("name") not in ("NATS_USER","NATS_PASS")
env = [e for e in env if not_user_pass(e)]
# ensure NATS_URL present/updated
found = False
for e in env:
    if e.get("name") == "NATS_URL":
        e["value"] = "nats://127.0.0.1:4222"; found = True; break
if not found:
    env.append({"name":"NATS_URL","value":"nats://127.0.0.1:4222"})
cortex["env"] = env

# Ensure mounts on cortex
vm = cortex.get("volumeMounts", [])
def ensure_mount(name, path):
    for m in vm:
        if m.get("name")==name and m.get("mountPath")==path:
            return
    vm.append({"name":name,"mountPath":path})
ensure_mount("tmp","/tmp")
ensure_mount("phi-data","/var/lib/phi")
cortex["volumeMounts"] = vm

# Ensure volumes (tmp, phi-data, phi-leaf-config)
vols = spec.get("volumes", [])
def ensure_vol_tmp(name):
    for v in vols:
        if v.get("name")==name and "emptyDir" in v:
            return
    vols.append({"name":name,"emptyDir":{}})
def ensure_vol_cm(name, cm, key, path):
    for v in vols:
        if v.get("name")==name and v.get("configMap",{}).get("name")==cm:
            return
    vols.append({"name":name,"configMap":{"name":cm,"items":[{"key":key,"path":path}]}})
ensure_vol_tmp("tmp")
ensure_vol_tmp("phi-data")
ensure_vol_cm("phi-leaf-config","phi-leaf-config","nats.conf","nats.conf")
spec["volumes"] = vols

# Ensure phi-leaf sidecar exists/updated
leaf = None
for c in containers:
    if c.get("name")=="phi-leaf":
        leaf = c
        break
leaf_tpl = {
  "name":"phi-leaf",
  "image":"nats:2.10-alpine",
  "args":["-c","/etc/nats/nats.conf"],
  "ports":[{"containerPort":4222,"name":"nats"}],
  "volumeMounts":[{"name":"phi-leaf-config","mountPath":"/etc/nats"}],
  "securityContext":{"runAsNonRoot":True,"allowPrivilegeEscalation":False,
                     "seccompProfile":{"type":"RuntimeDefault"},
                     "capabilities":{"drop":["ALL"]}},
  "readinessProbe":{"tcpSocket":{"port":4222},"initialDelaySeconds":3,"periodSeconds":10},
  "livenessProbe":{"tcpSocket":{"port":4222},"initialDelaySeconds":5,"periodSeconds":10}
}
if leaf is None:
    containers.append(leaf_tpl)
else:
    # update in place
    leaf.update(leaf_tpl)

spec["containers"] = containers
d["spec"]["template"]["spec"] = spec

# Dump as YAML
yaml.safe_dump(d, open(out,"w"), sort_keys=False)
PY

echo "== Apply fixed Deployment =="
kubectl apply -f "$OUT"

echo "== Rollout & verify =="
kubectl -n "$PHI_NS" rollout status deploy/"$PHI_DEPLOY" --timeout=180s || true
POD="$(kubectl -n "$PHI_NS" get pod -l app=phi-cortex -o jsonpath='{.items[0].metadata.name}')"
echo "Pod: $POD"
echo "[containers]"
kubectl -n "$PHI_NS" get pod "$POD" -o json | jq -r '.spec.containers[].name'
echo "[cortex env]"
kubectl -n "$PHI_NS" exec "$POD" -c cortex -- sh -lc 'echo NATS_URL=$NATS_URL; echo "user=$NATS_USER pass=$NATS_PASS (should be empty)" || true' || true
echo "[leaf TCP readiness]"
kubectl -n "$PHI_NS" exec "$POD" -c phi-leaf -- sh -lc 'wget -qO- http://127.0.0.1:4222 2>/dev/null || echo "ok (no http, tcpSocket probes handle readiness)"' || true
echo "[recent cortex logs]"
kubectl -n "$PHI_NS" logs "$POD" -c cortex --tail=120 --since=2m || true
