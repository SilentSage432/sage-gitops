#!/usr/bin/env bash
set -euo pipefail

NS_OMEGA=arc-omega
NS_CHI=arc-chi
NS_SIGMA=arc-sigma

echo "[Ω] Grab Chi IP + Sigma creds…"
CHI_IP="$(kubectl -n ${NS_CHI} get svc chi-bus -o jsonpath='{.spec.clusterIP}')"
SIGMA_USER="$(kubectl -n ${NS_SIGMA} get secret nats-sigma -o jsonpath='{.data.NATS_USER}' | base64 -d)"
SIGMA_PASS="$(kubectl -n ${NS_SIGMA} get secret nats-sigma -o jsonpath='{.data.NATS_PASS}' | base64 -d)"

pub() {
  local subject="$1" payload="$2" name="$3"
  echo "[Ω] Publish ${name} → ${subject}"
  kubectl -n ${NS_CHI} run "nbox-${name,,}" --restart=Never --image=synadia/nats-box:latest --command -- \
    nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${CHI_IP}:4222 ${subject} "${payload}" >/dev/null 2>&1 || true
  # Wait for pod to start and/or complete so logs are available
  for i in {1..15}; do
    phase=$(kubectl -n ${NS_CHI} get pod "nbox-${name,,}" -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    if [ "$phase" = "Running" ] || [ "$phase" = "Succeeded" ] || [ -z "$phase" ]; then
      break
    fi
    sleep 1
  done
  kubectl -n ${NS_CHI} logs "nbox-${name,,}" --tail=50 || true
  kubectl -n ${NS_CHI} delete pod "nbox-${name,,}" --now --ignore-not-found >/dev/null 2>&1 || true
}

echo "[Ω] Send a known reason (HEARTBEAT)…"
pub omega.reason '{"reason_code":"HEARTBEAT","note":"demo"}' KNOWN

echo "[Ω] Send an unknown reason (ZZZ_UNKNOWN) to trigger guard/metric…"
pub omega.reason '{"reason_code":"ZZZ_UNKNOWN","note":"should-flag"}' UNKNOWN

echo "[Ω] Tail omega-monitor for intake/anomaly lines (last 2m)…"
kubectl -n ${NS_OMEGA} logs deploy/omega-monitor --since=2m \
  | egrep -i 'HEARTBEAT|ANOMALY_UNKNOWN_REASON|ZZZ_UNKNOWN' || true

echo "[Ω] Metrics probe (omega_unknown_reason_total)…"
# Use a local port-forward to the metrics Service for PodSecurity compatibility
kubectl -n ${NS_OMEGA} port-forward svc/omega-monitor-metrics 18081:8081 >/dev/null 2>&1 &
PF_PID=$!
# Wait for port-forward to be ready
for i in {1..20}; do
  if curl -sf http://127.0.0.1:18081/metrics >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
curl -sf http://127.0.0.1:18081/metrics | grep -E 'omega_unknown_reason_total|^#' | head -n 10 || true
kill $PF_PID >/dev/null 2>&1 || true
wait $PF_PID 2>/dev/null || true


