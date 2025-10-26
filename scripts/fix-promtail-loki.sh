#!/usr/bin/env bash
set -euo pipefail

NS=observability
PORT=3100

echo "== Detecting labels =="
# Pick first loki pod + gather labels
LOKI_POD=$(kubectl -n $NS get pod -l app=loki -o name | head -n1 || true)
if [[ -z "$LOKI_POD" ]]; then
  # try common alt label
  LOKI_POD=$(kubectl -n $NS get pod -l app.kubernetes.io/name=loki -o name | head -n1 || true)
fi
if [[ -z "$LOKI_POD" ]]; then
  echo "!! Could not find a Loki pod in namespace $NS. Aborting."
  exit 1
fi

# Extract label key/value we can match on (prefer app, then app.kubernetes.io/name)
if kubectl -n $NS get "$LOKI_POD" -o jsonpath='{.metadata.labels.app}' >/dev/null 2>&1; then
  LOKI_KEY="app"
  LOKI_VAL=$(kubectl -n $NS get "$LOKI_POD" -o jsonpath='{.metadata.labels.app}')
else
  LOKI_KEY="app.kubernetes.io/name"
  LOKI_VAL=$(kubectl -n $NS get "$LOKI_POD" -o jsonpath='{.metadata.labels.app\.kubernetes\.io/name}')
fi
echo "Loki label detected: $LOKI_KEY=$LOKI_VAL"

# Promtail label detection (prefer app=promtail)
PROM_LABEL_KEY="app"
PROM_LABEL_VAL="promtail"
if ! kubectl -n $NS get pod -l ${PROM_LABEL_KEY}=${PROM_LABEL_VAL} -o name | grep -q . ; then
  # fall back to name label if needed
  if kubectl -n $NS get pod -l app.kubernetes.io/name=promtail -o name | grep -q . ; then
    PROM_LABEL_KEY="app.kubernetes.io/name"
    PROM_LABEL_VAL="promtail"
  else
    echo "!! Could not find a promtail pod with labels {app=promtail} or {app.kubernetes.io/name=promtail}."
    echo "   Run: kubectl -n $NS get pods --show-labels"
    exit 1
  fi
fi
echo "Promtail label detected: $PROM_LABEL_KEY=$PROM_LABEL_VAL"

echo "== Applying NetworkPolicies =="
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: promtail-egress-allow-loki-dns
  namespace: ${NS}
spec:
  podSelector:
    matchLabels:
      ${PROM_LABEL_KEY}: ${PROM_LABEL_VAL}
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels:
              ${LOKI_KEY}: ${LOKI_VAL}
      ports:
        - protocol: TCP
          port: ${PORT}
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
YAML

# If you have ingress default-deny for Loki, allow promtail -> loki ingress explicitly:
cat <<YAML | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: loki-ingress-allow-promtail
  namespace: ${NS}
spec:
  podSelector:
    matchLabels:
      ${LOKI_KEY}: ${LOKI_VAL}
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              ${PROM_LABEL_KEY}: ${PROM_LABEL_VAL}
      ports:
        - protocol: TCP
          port: ${PORT}
YAML

echo "== Waiting 5s and testing connectivity from a Promtail pod =="
sleep 5

PROM_POD=$(kubectl -n $NS get pod -l ${PROM_LABEL_KEY}=${PROM_LABEL_VAL} -o jsonpath='{.items[0].metadata.name}')
set +e
kubectl -n $NS exec "$PROM_POD" -- sh -lc 'apk add --no-cache curl >/dev/null 2>&1 || true; curl -sS --max-time 5 http://loki.observability.svc.cluster.local:3100/ready'
READY_RC=$?
set -e

if [[ $READY_RC -ne 0 ]]; then
  echo "!! Promtail still cannot reach Loki service."
  echo "   Quick checks:"
  echo "   - kubectl -n $NS get svc loki -o wide"
  echo "   - kubectl -n $NS get pods -l ${LOKI_KEY}=${LOKI_VAL} -o wide"
  echo "   - kubectl -n $NS logs ds/promtail -c promtail --tail=200 | egrep -i \"error|denied|refused|timeout|push\" || true"
  exit 2
fi

echo "== Connectivity looks good. Promtail should start pushing logs within seconds."
