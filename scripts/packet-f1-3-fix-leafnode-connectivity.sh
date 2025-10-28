#!/usr/bin/env bash
set -euo pipefail

NS_CHI=arc-chi
NS_OMEGA=arc-omega
DEPLOY_CHI=chi-bus
DEPLOY_OMEGA=omega-monitor
LEAF_PORT=7422
CLIENT_PORT=4222

echo "[fix] Get Chi ClusterIP…"
CHI_IP="$(kubectl -n $NS_CHI get svc $DEPLOY_CHI -o jsonpath='{.spec.clusterIP}')"
echo "CHI_IP=$CHI_IP"

echo "[fix] Ensure chi-bus Service exposes leaf port…"
kubectl -n $NS_CHI patch svc $DEPLOY_CHI --type='merge' -p "{
  \"spec\": { \"ports\": [
    {\"name\":\"nats\",\"port\":$CLIENT_PORT,\"targetPort\":$CLIENT_PORT,\"protocol\":\"TCP\"},
    {\"name\":\"leaf\",\"port\":$LEAF_PORT,\"targetPort\":$LEAF_PORT,\"protocol\":\"TCP\"}
  ]}
}"

echo "[fix] Ingress: allow Omega → Chi on 7422"
cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: chi-allow-leaf-ingress
  namespace: $NS_CHI
spec:
  endpointSelector:
    matchLabels:
      app: $DEPLOY_CHI
  ingress:
  - fromEndpoints:
    - matchLabels:
        k8s:io.kubernetes.pod.namespace: $NS_OMEGA
    toPorts:
    - ports:
      - port: "$LEAF_PORT"
        protocol: TCP
YAML

echo "[fix] Egress: allow Omega → Chi:7422"
cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: omega-allow-leaf-egress
  namespace: $NS_OMEGA
spec:
  endpointSelector:
    matchLabels:
      app: $DEPLOY_OMEGA
  egress:
  - toEndpoints:
    - matchLabels:
        app: $DEPLOY_CHI
        k8s:io.kubernetes.pod.namespace: $NS_CHI
    toPorts:
    - ports:
      - port: "$LEAF_PORT"
        protocol: TCP
YAML

echo "[fix] Refresh omega leaf config to use numeric ClusterIP (no DNS)…"
OMEGA_USER="$(kubectl -n $NS_OMEGA get secret nats-omega -o jsonpath='{.data.NATS_USER}' | base64 -d)"
OMEGA_PASS="$(kubectl -n $NS_OMEGA get secret nats-omega -o jsonpath='{.data.NATS_PASS}' | base64 -d)"

cat > /tmp/omega-leaf.conf <<CONF
port: $CLIENT_PORT
server_name: omega-leaf
leafnodes {
  remotes: [
    { url: "nats://${OMEGA_USER}:${OMEGA_PASS}@${CHI_IP}:${LEAF_PORT}" }
  ]
}
CONF

kubectl -n $NS_OMEGA create configmap omega-leaf-config --from-file=leaf.conf=/tmp/omega-leaf.conf \
  -o yaml --dry-run=client | kubectl apply -f -

echo "[fix] Roll chi-bus (if it just gained the leaf port) and omega-monitor…"
kubectl -n $NS_CHI rollout restart deploy/$DEPLOY_CHI
kubectl -n $NS_OMEGA rollout restart deploy/$DEPLOY_OMEGA

kubectl -n $NS_CHI rollout status deploy/$DEPLOY_CHI --timeout=180s || true
kubectl -n $NS_OMEGA rollout status deploy/$DEPLOY_OMEGA --timeout=180s || true

echo "[verify] From sidecar container, test TCP reachability to Chi leaf port…"
kubectl -n $NS_OMEGA exec deploy/$DEPLOY_OMEGA -c nats-leaf -- sh -lc "apk add --no-cache busybox-extras >/dev/null 2>&1 || true; nc -zv $CHI_IP $LEAF_PORT; echo EXIT:$?"

echo "[verify] Publish a test reason and look for it on omega-monitor…"
kubectl -n $NS_CHI run natsbox-fix --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://${CHI_IP}:$CLIENT_PORT omega.reason '{\"reason_code\":\"OMEGA_SIDECAR_OK\",\"note\":\"leaf-7422\"}'"
kubectl -n $NS_CHI wait --for=condition=Succeeded pod/natsbox-fix --timeout=60s || true
kubectl -n $NS_OMEGA logs deploy/$DEPLOY_OMEGA --since=2m | egrep -i 'OMEGA_SIDECAR_OK|leaf|connected|authorization|authentication' || true

echo "[done] If nc connect succeeds and log shows OMEGA_SIDECAR_OK without auth errors, leaf is good."
