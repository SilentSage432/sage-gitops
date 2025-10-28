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
  kubectl -n ${NS_CHI} run "nbox-${name,,}" --restart=Never --image=synadia/nats-box:latest -- \
    sh -lc "nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${CHI_IP}:4222 ${subject} '${payload}'" >/dev/null 2>&1 || true
  sleep 1
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
kubectl -n ${NS_OMEGA} run curlz --restart=Never --rm -it --image=curlimages/curl:8.10.1 -- \
  curl -sf http://omega-monitor-metrics.arc-omega.svc.cluster.local:8081/metrics \
  | grep -E 'omega_unknown_reason_total|^#' | head -n 10 || true


