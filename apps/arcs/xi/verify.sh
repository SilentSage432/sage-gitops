#!/usr/bin/env bash
set -euo pipefail
kubectl -n arc-xi rollout status deploy/xenolith-ledger
# publish a probe reason
kubectl -n arc-chi run natsbox-xi --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://chi-bus.arc-chi.svc.cluster.local:4222 omega.reason '{\"reason_code\":\"XI_PROBE\",\"note\":\"ledger\"}'"
kubectl -n arc-chi wait --for=condition=Succeeded pod/natsbox-xi --timeout=60s || true
# read last lines via HTTP
PF=$RANDOM; kubectl -n arc-xi port-forward svc/xenolith-ledger ${PF}:8090 >/dev/null 2>&1 &
sleep 1
curl -sf "http://localhost:${PF}/tail?lines=50" | sed -n '1,10p'
kill %1 2>/dev/null || true
