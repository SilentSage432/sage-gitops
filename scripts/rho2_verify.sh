#!/usr/bin/env bash
set -euo pipefail
echo "[Rho²] Ensure gate up & service reachable…"
kubectl -n arc-rho2 rollout status deploy/rho2-gate

echo "[Rho²] Check arcs have posture labels/annos and point to gate…"
for ns in arc-omega arc-sigma arc-lambda; do
  kubectl -n $ns get deploy -o json \
    | jq -r '.items[] | [.metadata.name,
       (.spec.template.metadata.labels["rho2.identity"] // ""),
       (.spec.template.metadata.annotations["rho2.posture.hash"] // ""),
       ( [ .spec.template.spec.containers[]
           | select(.env!=null)
           | (.env[]? | select(.name=="NATS_URL") | .value ) ] | join(",") )
      ] | @tsv'
done
