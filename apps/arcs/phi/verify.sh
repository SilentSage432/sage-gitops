#!/usr/bin/env bash
set -euo pipefail
kubectl -n arc-phi rollout status deploy/phi-cortex
# Stimulate: stop heartbeats for 2m or send no-op then check for proposal
kubectl -n arc-chi run natsbox-phi --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://chi-bus.arc-chi.svc.cluster.local:4222 lambda.acks.test '{}'"
kubectl -n arc-chi wait --for=condition=Succeeded pod/natsbox-phi --timeout=60s || true
echo "[phi] Tail omega-monitor for INSIGHT/PROPOSAL…"
kubectl -n arc-omega logs deploy/omega-monitor --since=3m | egrep -i 'OMEGA_INSIGHT|OMEGA_PROPOSAL|SIGMA_HEARTBEAT_GAP|WAKE_LAMBDA' || true
