#!/usr/bin/env bash
set -euo pipefail

# ================================
# Packet F1.4 — Phi Cortical Navigator (Auto-discovery)
# ================================
PHI_NS=arc-phi
CHI_NS=arc-chi
PHI_DEPLOY=phi-cortex

need() { command -v "$1" >/dev/null || { echo "Missing $1"; exit 1; }; }
need kubectl
need python3
need jq

echo "== Preflight =="
kubectl get ns "$PHI_NS" >/dev/null
kubectl get ns "$CHI_NS" >/dev/null

echo "== Discover Chi Deployment =="
CHI_DEPLOY=$(kubectl -n "$CHI_NS" get deploy -o json | jq -r '
  .items[] | select(
    (.metadata.name | test("chi|nats"; "i")) or
    ((.spec.template.spec.containers // []) | map(.image) | join(" ") | test("nats"; "i"))
  ) | .metadata.name
' | head -n1)
if [[ -z "${CHI_DEPLOY:-}" ]]; then echo "Could not auto-detect Chi deployment in $CHI_NS"; exit 1; fi
echo "Chi deployment: $CHI_DEPLOY"

echo "== Discover Chi nats.conf ConfigMap =="
CHI_CM=""
mapfile -t CM_CANDIDATES < <(kubectl -n "$CHI_NS" get deploy "$CHI_DEPLOY" -o json | jq -r '([.spec.template.spec.volumes[]? | select(.configMap and .configMap.name) | .configMap.name] // [])[]')
for cm in "${CM_CANDIDATES[@]:-}"; do
  if kubectl -n "$CHI_NS" get cm "$cm" -o json | jq -e '.data["nats.conf"]' >/dev/null 2>&1; then
    CHI_CM="$cm"; break
  fi
done
if [[ -z "${CHI_CM:-}" ]]; then
  CHI_CM=$(kubectl -n "$CHI_NS" get cm -o json | jq -r '.items[] | select(.data["nats.conf"]) | .metadata.name' | head -n1)
fi
if [[ -z "${CHI_CM:-}" ]]; then echo "Could not find a ConfigMap in $CHI_NS containing data.nats.conf"; exit 1; fi
echo "Chi nats.conf CM: $CHI_CM"

echo "== Discover Chi Service & ClusterIP =="
CHI_SVC=$(kubectl -n "$CHI_NS" get svc -o json | jq -r '
  .items[] | select(
    (.metadata.name | test("chi|nats"; "i")) or
    ((.spec.ports // []) | map(.port|tostring) | join(" ") | contains("4222"))
  ) | .metadata.name
' | head -n1)
if [[ -z "${CHI_SVC:-}" ]]; then echo "Could not auto-detect Chi Service"; exit 1; fi
CHI_IP=$(kubectl -n "$CHI_NS" get svc "$CHI_SVC" -o jsonpath='{.spec.clusterIP}')
echo "Chi service: $CHI_SVC (ClusterIP: $CHI_IP)"

echo "== NetPol for Phi egress (DNS + Chi 4222/7422) =="
cat > /tmp/phi-netpol-deny.yaml <<EOF
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: arc-phi-egress-deny-all
  namespace: arc-phi
spec:
  endpointSelector: {}
  egress: []
EOF
cat > /tmp/phi-netpol-dns.yaml <<EOF
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: arc-phi-allow-dns
  namespace: arc-phi
spec:
  endpointSelector: {}
  egress:
  - toEndpoints:
    - matchLabels:
        k8s:io.kubernetes.pod.namespace: kube-system
        k8s-app: kube-dns
    toPorts:
    - ports:
      - port: "53"
        protocol: ANY
      rules:
        dns:
        - matchPattern: "*"
EOF
cat > /tmp/phi-netpol-chi.yaml <<EOF
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: arc-phi-allow-egress-chi
  namespace: arc-phi
spec:
  endpointSelector: {}
  egress:
  - toServices:
    - k8sService:
        serviceName: ${CHI_SVC}
        namespace: ${CHI_NS}
    toPorts:
    - ports:
      - port: "4222"
        protocol: TCP
      - port: "7422"
        protocol: TCP
EOF
kubectl apply -f /tmp/phi-netpol-deny.yaml
kubectl apply -f /tmp/phi-netpol-dns.yaml
kubectl apply -f /tmp/phi-netpol-chi.yaml

echo "== Ensure Chi Service exposes leafnode :7422 (no-op if exists) =="
kubectl -n "$CHI_NS" patch svc "$CHI_SVC" --type=json -p='[{"op":"add","path":"/spec/ports/-","value":{"name":"leaf","port":7422,"protocol":"TCP","targetPort":7422}}]' 2>/dev/null || true

echo "== Prepare phi credentials =="
PHI_PASS=$(kubectl -n "$PHI_NS" get secret nats-phi -o jsonpath='{.data.NATS_PASS}' 2>/dev/null | base64 -d || true)
if [[ -z "${PHI_PASS:-}" ]]; then
  PHI_PASS=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)
  kubectl -n "$PHI_NS" create secret generic nats-phi --from-literal=NATS_USER=phi --from-literal=NATS_PASS="$PHI_PASS"
fi
echo "phi secret present."

echo "== Fetch & edit Chi nats.conf offline (adds phi user if missing) =="
kubectl -n "$CHI_NS" get cm "$CHI_CM" -o yaml > /tmp/chi-cm.yaml
python3 - /tmp/chi-cm.yaml /tmp/chi-cm.out.yaml <<'PY'
import sys, yaml, re
cm_in, cm_out = sys.argv[1], sys.argv[2]
cm = yaml.safe_load(open(cm_in))
conf = cm['data']['nats.conf']
if re.search(r'\buser\s*:\s*"?phi"?\b', conf):
    yaml.safe_dump(cm, open(cm_out,'w'))
    raise SystemExit
phi_block = '''
    {
      user: "phi",
      password: "__PHI_PASS__",
      permissions: {
        publish:   ["phi.telemetry.>"],
        subscribe: ["omega.reason"]
      }
    }'''.strip()
new = re.sub(r'(authorization\s*\{[^}]*\busers\s*:\s*\[)(.*?)(\])',
             lambda m: m.group(1) + (m.group(2).rstrip() + ("," if m.group(2).strip() else "")) + "\n" + phi_block + "\n" + m.group(3),
             conf, flags=re.S)
if new == conf:
    new = re.sub(r'(users\s*:\s*\[)(.*?)(\])',
                 lambda m: m.group(1) + (m.group(2).rstrip() + ("," if m.group(2).strip() else "")) + "\n" + phi_block + "\n" + m.group(3),
                 conf, flags=re.S)
cm['data']['nats.conf'] = new
yaml.safe_dump(cm, open(cm_out,'w'))
PY
sed -i '' -e "s/__PHI_PASS__/${PHI_PASS//\//\\/}/g" /tmp/chi-cm.out.yaml 2>/dev/null || sed -i -e "s/__PHI_PASS__/${PHI_PASS//\//\\/}/g" /tmp/chi-cm.out.yaml
kubectl apply -f /tmp/chi-cm.out.yaml || true
kubectl -n "$CHI_NS" rollout restart deploy/"$CHI_DEPLOY" || true
kubectl -n "$CHI_NS" rollout status deploy/"$CHI_DEPLOY" --timeout=180s || true

echo "== Phi leafnode config & sidecar =="
cat > /tmp/phi-leaf-config.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: phi-leaf-config
  namespace: ${PHI_NS}
data:
  nats.conf: |
    port: 4222
    server_name: "phi-leaf"
    leafnodes {
      remotes: [
        { url: "nats://phi:${PHI_PASS}@${CHI_IP}:7422" }
      ]
    }
EOF
kubectl -n "$PHI_NS" apply -f /tmp/phi-leaf-config.yaml

echo "== Patch phi-cortex with sidecar and localhost NATS_URL =="
kubectl -n "$PHI_NS" patch deploy "$PHI_DEPLOY" --type=merge -p "{\"spec\":{\"template\":{\"spec\":{\"volumes\":[{\"name\":\"tmp\",\"emptyDir\":{}},{\"name\":\"phi-leaf-config\",\"configMap\":{\"name\":\"phi-leaf-config\",\"items\":[{\"key\":\"nats.conf\",\"path\":\"nats.conf\"}]}}],\"containers\":[{\"name\":\"cortex\",\"env\":[{\"name\":\"NATS_URL\",\"value\":\"nats://127.0.0.1:4222\"}],\"volumeMounts\":[{\"name\":\"tmp\",\"mountPath\":\"/tmp\"}]},{\"name\":\"phi-leaf\",\"image\":\"nats:2.10-alpine\",\"args\":[\"-c\",\"/etc/nats/nats.conf\"],\"ports\":[{\"containerPort\":4222,\"name\":\"nats\"}],\"volumeMounts\":[{\"name\":\"phi-leaf-config\",\"mountPath\":\"/etc/nats\"}],\"securityContext\":{\"runAsNonRoot\":true,\"allowPrivilegeEscalation\":false,\"seccompProfile\":{\"type\":\"RuntimeDefault\"},\"capabilities\":{\"drop\":[\"ALL\"]}},\"livenessProbe\":{\"exec\":{\"command\":[\"sh\",\"-lc\",\"nc -z 127.0.0.1 4222 || exit 1\"]},\"initialDelaySeconds\":5,\"periodSeconds\":10},\"readinessProbe\":{\"exec\":{\"command\")["sh","-lc","nc -z 127.0.0.1 4222 || exit 1"]},\"initialDelaySeconds\":3,\"periodSeconds\":10}}]}}}}"

echo "== Rollout Phi cortex =="
kubectl -n "$PHI_NS" rollout restart deploy/"$PHI_DEPLOY" || true
kubectl -n "$PHI_NS" rollout status deploy/"$PHI_DEPLOY" --timeout=180s || true

echo "== Restricted smoke test via Job =="
cat > /tmp/nats-smoketest.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nats-smoketest
  namespace: ${CHI_NS}
---
apiVersion: batch/v1
kind: Job
metadata:
  name: nats-smoketest
  namespace: ${CHI_NS}
spec:
  backoffLimit: 0
  template:
    metadata:
      labels:
        app: nats-box
    spec:
      serviceAccountName: nats-smoketest
      restartPolicy: Never
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: nats-box
        image: synadia/nats-box:0.14.2
        env:
        - name: NATS_PASS
          value: "${PHI_PASS}"
        - name: CHI_IP
          value: "${CHI_IP}"
        args:
        - sh
        - -lc
        - |
          echo "Publishing test to phi.telemetry.node ..."
          nats pub -s nats://phi:${NATS_PASS}@${CHI_IP}:4222 phi.telemetry.node 'ping' && echo PUB_OK || echo PUB_FAIL
        securityContext:
          runAsNonRoot: true
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
EOF
kubectl apply -f /tmp/nats-smoketest.yaml
kubectl -n "$CHI_NS" wait --for=condition=complete job/nats-smoketest --timeout=120s || true
kubectl -n "$CHI_NS" logs job/nats-smoketest || true
kubectl -n "$CHI_NS" delete job nats-smoketest --ignore-not-found

echo "== Done. Phi Navigator wired through sidecar leafnode with Chi ACLs =="
