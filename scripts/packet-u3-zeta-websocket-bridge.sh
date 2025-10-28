#!/usr/bin/env bash
set -euo pipefail

NS_CHI=arc-chi
NS_ZETA=arc-zeta
NS_OMEGA=arc-omega
NS_UI=arc-ui
APP_CHI=chi-bus
APP_ZETA=observer-api
APP_UI=sage-enterprise-ui
PORT_NATS=4222
PORT_WS=8082

echo "[U3] Discover Chi ClusterIP…"
CHI_IP="$(kubectl -n $NS_CHI get svc $APP_CHI -o jsonpath='{.spec.clusterIP}')"
echo "CHI_IP=$CHI_IP"

echo "[U3] Copy omega read-only NATS creds into arc-zeta (subscribe to omega.reason)…"
OMEGA_USER="$(kubectl -n $NS_OMEGA get secret nats-omega -o jsonpath='{.data.NATS_USER}' | base64 -d)"
OMEGA_PASS="$(kubectl -n $NS_OMEGA get secret nats-omega -o jsonpath='{.data.NATS_PASS}' | base64 -d)"
kubectl -n $NS_ZETA delete secret nats-omega 2>/dev/null || true
kubectl -n $NS_ZETA create secret generic nats-omega \
  --from-literal=NATS_USER="$OMEGA_USER" \
  --from-literal=NATS_PASS="$OMEGA_PASS"

echo "[U3] NetPol: default-deny egress for arc-zeta + allow DNS + allow Chi:4222…"
cat <<YAML | kubectl apply -f -
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: arc-zeta-egress-deny-all, namespace: ${NS_ZETA} }
spec:
  endpointSelector: {}
  egress: []
---
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: arc-zeta-allow-dns, namespace: ${NS_ZETA} }
spec:
  endpointSelector: {}
  egress:
  - toEndpoints:
    - matchLabels:
        k8s:io.kubernetes.pod.namespace: kube-system
        k8s-app: kube-dns
    toPorts:
    - ports: [{port: "53", protocol: UDP}, {port: "53", protocol: TCP}]
---
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata: { name: arc-zeta-allow-egress-chi, namespace: ${NS_ZETA} }
spec:
  endpointSelector: {}
  egress:
  - toEndpoints:
    - matchLabels:
        app: ${APP_CHI}
        k8s:io.kubernetes.pod.namespace: ${NS_CHI}
    toPorts:
    - ports: [{port: "${PORT_NATS}", protocol: TCP}]
YAML

echo "[U3] Patch observer-api Deployment to subscribe to omega.reason and serve /ws…"
# Ensure env exists then set NATS params
kubectl -n $NS_ZETA patch deploy/$APP_ZETA --type='json' -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/env","value":[]}
]' 2>/dev/null || true

kubectl -n $NS_ZETA patch deploy/$APP_ZETA --type='json' -p="[
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":{\"name\":\"NATS_HOST\",\"value\":\"${CHI_IP}\"}},
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":{\"name\":\"NATS_PORT\",\"value\":\"${PORT_NATS}\"}},
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":{\"name\":\"NATS_SUBJECT\",\"value\":\"omega.reason\"}},
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":{\"name\":\"NATS_USER\",\"valueFrom\":{\"secretKeyRef\":{\"name\":\"nats-omega\",\"key\":\"NATS_USER\"}}}},
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/env/-\",\"value\":{\"name\":\"NATS_PASS\",\"valueFrom\":{\"secretKeyRef\":{\"name\":\"nats-omega\",\"key\":\"NATS_PASS\"}}}},
  {\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/ports\",\"value\":[{\"name\":\"http\",\"containerPort\":${PORT_WS}}]}
]"

echo "[U3] Service on :8082 for WebSocket…"
kubectl -n $NS_ZETA apply -f - <<YAML
apiVersion: v1
kind: Service
metadata:
  name: ${APP_ZETA}
  namespace: ${NS_ZETA}
spec:
  selector: { app: ${APP_ZETA} }
  ports:
    - name: http
      port: ${PORT_WS}
      targetPort: ${PORT_WS}
YAML

echo "[U3] Roll and wait…"
kubectl -n $NS_ZETA rollout restart deploy/$APP_ZETA || true
kubectl -n $NS_ZETA rollout status  deploy/$APP_ZETA --timeout=180s || true

echo "[U3] Quick endpoint test (port-forward) …"
# You can keep this running in another terminal; here we do a short test
kubectl -n $NS_ZETA port-forward svc/${APP_ZETA} 8082:${PORT_WS} >/tmp/zeta-pf.log 2>&1 & PF_PID=$!
sleep 2
echo "WebSocket target (local): ws://localhost:8082/ws"
echo "Kill port-forward with: kill $PF_PID"
