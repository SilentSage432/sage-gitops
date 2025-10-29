#!/usr/bin/env bash
set -euo pipefail
kubectl -n arc-psi rollout status deploy/psi-orchestrator
# Emit a proposal that Psi should accept (WAKE_LAMBDA or a sandbox task)
kubectl -n arc-chi run natsbox-psi --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://10.111.237.23:4222 omega.proposal.sandbox '{\"image\":\"ghcr.io/silentsage432/sandbox-runner:latest\",\"cmd\":[\"/bin/sh\",\"-lc\",\"echo hello from sandbox; sleep 2\"]}'"
kubectl -n arc-chi wait --for=condition=Succeeded pod/natsbox-psi --timeout=60s || true
# Check a sandbox job exists and completed
kubectl -n arc-sandbox get jobs -l psi.sandbox=yes
