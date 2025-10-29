#!/usr/bin/env bash
set -euo pipefail
# 1) Secret for phi user
kubectl -n arc-chi delete secret nats-phi --ignore-not-found
kubectl -n arc-chi create secret generic nats-phi \
  --from-literal=NATS_USER=phi \
  --from-literal=NATS_PASS="$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 24)"

# 2) Patch chi ConfigMap (users + permissions)
CM=$(kubectl -n arc-chi get cm chi-nats-config -o json)
echo "$CM" | jq '
  .data["nats.conf"] |=
    (split("\n") | join("\n"))
    ' >/tmp/chi-nats-config.json # (Cursor: replace with deterministic yq/jq edit inserting phi user with pub omega.insight.>, omega.proposal.> and sub omega.reason, sigma.telemetry.>)
# Hand-off note: keep using your existing safe editor that added omega/sigma/lambda users.
echo "[phi] Remember to insert user phi with pub:[\"omega.insight.>\",\"omega.proposal.>\"] sub:[\"omega.reason\",\"sigma.telemetry.>\"] into nats.conf and rollout chi-bus."
