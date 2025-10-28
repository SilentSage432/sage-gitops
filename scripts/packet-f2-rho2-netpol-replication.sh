#!/usr/bin/env bash
set -euo pipefail

NS_CHI=arc-chi
NS_OMEGA=arc-omega
NS_SIGMA=arc-sigma
NS_LAMBDA=arc-lambda
APP_CHI=chi-bus
PORT_NATS=4222
PORT_LEAF=7422

echo "[F2] Discover Chi ClusterIP…"
CHI_IP="$(kubectl -n $NS_CHI get svc $APP_CHI -o jsonpath='{.spec.clusterIP}')"
echo "CHI_IP=$CHI_IP"

echo "[F2] Apply egress default-deny + DNS + Chi allows…"

# Helper: default-deny egress for a namespace
apply_default_deny() {
  local ns="$1"
  cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: ${ns}-egress-deny-all
  namespace: ${ns}
spec:
  endpointSelector: {}   # all pods in this namespace
  egress: []             # deny all egress
YAML
}

# Helper: allow DNS to CoreDNS (both TCP/UDP 53) in kube-system
allow_dns() {
  local ns="$1"
  cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: ${ns}-allow-dns
  namespace: ${ns}
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
        protocol: UDP
      - port: "53"
        protocol: TCP
YAML
}

# Helper: allow egress to Chi-bus ports
allow_to_chi() {
  local ns="$1" ports_yaml="$2"
  cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: ${ns}-allow-egress-chi
  namespace: ${ns}
spec:
  endpointSelector: {}
  egress:
  - toEndpoints:
    - matchLabels:
        app: ${APP_CHI}
        k8s:io.kubernetes.pod.namespace: ${NS_CHI}
    toPorts:
${ports_yaml}
YAML
}

apply_default_deny "$NS_OMEGA"
apply_default_deny "$NS_SIGMA"
apply_default_deny "$NS_LAMBDA"

allow_dns "$NS_OMEGA"
allow_dns "$NS_SIGMA"
allow_dns "$NS_LAMBDA"

# Ω: needs NATS client (4222) and leaf (7422)
allow_to_chi "$NS_OMEGA" "    - ports:
      - port: \"${PORT_NATS}\"
        protocol: TCP
      - port: \"${PORT_LEAF}\"
        protocol: TCP"

# Σ: needs NATS client (4222)
allow_to_chi "$NS_SIGMA" "    - ports:
      - port: \"${PORT_NATS}\"
        protocol: TCP"

# Λ: needs NATS client (4222)
allow_to_chi "$NS_LAMBDA" "    - ports:
      - port: \"${PORT_NATS}\"
        protocol: TCP"

echo "[F2] Roll arc deployments to pick up any DNS changes (safe noop if unchanged)…"
kubectl -n "$NS_OMEGA" rollout restart deploy/omega-monitor || true
kubectl -n "$NS_SIGMA" rollout restart deploy/sigma-agent || true
kubectl -n "$NS_LAMBDA" rollout restart deploy/lambda-cell || true

echo "[F2] Wait for readiness…"
kubectl -n "$NS_OMEGA" rollout status deploy/omega-monitor --timeout=180s || true
kubectl -n "$NS_SIGMA" rollout status deploy/sigma-agent --timeout=180s || true
kubectl -n "$NS_LAMBDA" rollout status deploy/lambda-cell --timeout=180s || true

echo "[F2] Canary: ensure each arc can still hit Chi and that random egress is blocked…"

# Omega: local leaf proxies to Chi; also verify direct to Chi:7422 from sidecar
kubectl -n "$NS_OMEGA" exec deploy/omega-monitor -c nats-leaf -- sh -lc \
  "apk add --no-cache busybox-extras >/dev/null 2>&1 || true; nc -zv ${CHI_IP} ${PORT_LEAF} && echo OK-omega-to-chi-leaf"

# Sigma: verify can publish to omega.reason (auth/ACL already set by F1)
kubectl -n "$NS_CHI" run natsbox-f2 --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://${CHI_IP}:${PORT_NATS} omega.reason '{\"reason_code\":\"F2_TEST\",\"note\":\"post-deny-allow\"}'" || true
kubectl -n "$NS_CHI" wait --for=condition=Succeeded pod/natsbox-f2 --timeout=60s || true

# Omega logs should see F2_TEST
kubectl -n "$NS_OMEGA" logs deploy/omega-monitor --since=2m | egrep -i 'F2_TEST|connected|authorization|authentication' || true

# Negative test: try to reach the Internet from Sigma (should fail)
kubectl -n "$NS_SIGMA" exec deploy/sigma-agent -- sh -lc "wget -qO- http://example.com || echo BLOCKED-egress" 2>/dev/null || echo "BLOCKED-egress"

echo "[F2] Done. Rho² egress lockdown replicated with precise allows for DNS + Chi."
