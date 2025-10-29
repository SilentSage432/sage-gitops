#!/usr/bin/env bash
set -euo pipefail
echo "[Θ] Ensure cloudflared and coredns rollouts…"
kubectl -n arc-theta rollout status deploy/cloudflared-doh
kubectl -n kube-system rollout restart deploy/coredns
kubectl -n kube-system rollout status deploy/coredns

echo "[Θ] Test DNS from arc-omega pod context…"
POD=$(kubectl -n arc-omega get pods -l app=omega-monitor -o jsonpath='{.items[0].metadata.name}')
kubectl -n arc-omega exec "$POD" -- sh -lc 'getent hosts example.com || nslookup example.com'

echo "[Θ] Confirm CoreDNS only hits DoH:"
kubectl -n kube-system logs deploy/coredns --since=2m | tail || true
kubectl -n arc-theta logs deploy/cloudflared-doh --since=2m | tail || true
