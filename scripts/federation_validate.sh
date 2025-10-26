#!/usr/bin/env bash
set -euo pipefail

# Namespaces & objects
NS_CHI="arc-chi"
NS_OMEGA="arc-omega"
NS_SIGMA="arc-sigma"
NS_LAMBDA="arc-lambda"
DEP_OMEGA="omega-monitor"

echo "== 0) Sanity: pods and services =="
kubectl get ns | grep -E "(arc-chi|arc-omega|arc-sigma|arc-lambda)" || true
kubectl -n "$NS_OMEGA" get deploy,po,svc || true
kubectl -n "$NS_CHI"   get deploy,po,svc || true
kubectl -n "$NS_SIGMA" get deploy,po     || true
kubectl -n "$NS_LAMBDA" get deploy,po    || true
echo

echo "== 1) Extract NATS URLs from Secrets (no plaintext in script) =="
OMEGA_URL="$(kubectl -n "$NS_OMEGA" get secret omega-nats-auth  -o jsonpath='{.data.NATS_URL}'  | base64 -d)"
SIGMA_URL="$(kubectl -n "$NS_SIGMA" get secret sigma-nats-auth  -o jsonpath='{.data.NATS_URL}'  | base64 -d || true)"
LAMBDA_URL="$(kubectl -n "$NS_LAMBDA" get secret lambda-nats-auth -o jsonpath='{.data.NATS_URL}' | base64 -d || true)"
printf 'OMEGA_URL=%s\n'  "${OMEGA_URL//:*@/:***@}"
printf 'SIGMA_URL=%s\n'  "${SIGMA_URL//:*@/:***@}"
printf 'LAMBDA_URL=%s\n' "${LAMBDA_URL//:*@/:***@}"
echo

echo "== 2) Ensure a test nats-box is available in arc-omega =="
kubectl -n "$NS_OMEGA" delete pod nats-box --ignore-not-found >/dev/null 2>&1 || true
kubectl -n "$NS_OMEGA" run nats-box --image=natsio/nats-box:0.13.0 --restart=Never -- sh -lc 'sleep 600' >/dev/null
kubectl -n "$NS_OMEGA" wait --for=condition=Ready pod/nats-box --timeout=60s >/dev/null
echo "nats-box ready."
echo

echo "== 3) Ω health and readiness =="
kubectl -n "$NS_OMEGA" get po -l app="$DEP_OMEGA" -o wide
kubectl -n "$NS_OMEGA" logs -l app="$DEP_OMEGA" --tail=20 || true
echo

echo "== 4) Chi connectivity (auth) quick probe with Ω creds =="
kubectl -n "$NS_OMEGA" exec nats-box -- sh -lc \
  "nats -s '$OMEGA_URL' account info >/dev/null 2>&1 && echo CONNECT_OK || echo CONNECT_FAIL"
echo

echo "== 5) Publish → omega.reason (expect Ω log line) =="
TS="$(date -u +%FT%TZ)"
kubectl -n "$NS_OMEGA" exec nats-box -- sh -lc \
  "nats -s '$OMEGA_URL' pub omega.reason '{\"code\":\"SYNC_READY\",\"note\":\"smoke\",\"ts\":\"$TS\"}'"
sleep 2
echo "-- Ω log tail (should include SYNC_READY) --"
kubectl -n "$NS_OMEGA" logs -l app="$DEP_OMEGA" --tail=80 | tail -n 80
echo

echo "== 6) (Optional) Publish from Sigma & Lambda creds (verifies their auth) =="
if [ -n "$SIGMA_URL" ]; then
  kubectl -n "$NS_OMEGA" exec nats-box -- sh -lc \
    "nats -s '$SIGMA_URL' pub sigma.telemetry '{\"metric\":\"heartbeat\",\"ts\":\"$TS\"}'" \
    && echo "SIGMA publish OK" || echo "SIGMA publish FAIL"
fi
if [ -n "$LAMBDA_URL" ]; then
  kubectl -n "$NS_OMEGA" exec nats-box -- sh -lc \
    "nats -s '$LAMBDA_URL' pub lambda.events '{\"event\":\"noop\",\"ts\":\"$TS\"}'" \
    && echo "LAMBDA publish OK" || echo "LAMBDA publish FAIL"
fi
echo

echo "== 7) One-shot subscription proof (receive 1 message) =="
# Subscribe once to omega.reason with Ω creds, publish another message, expect 1 recv
kubectl -n "$NS_OMEGA" exec nats-box -- sh -lc '
  set -e; rm -f /tmp/recv.txt;
  ( nats -s "'"$OMEGA_URL"'" sub omega.reason -C 1 -W 5 > /tmp/recv.txt 2>&1 || true ) & 
  SUBPID=$!; sleep 1;
  nats -s "'"$OMEGA_URL"'" pub omega.reason "{\"code\":\"LINK_OK\",\"note\":\"subcheck\",\"ts\":\"'"$TS"'\"}" >/dev/null 2>&1 || true
  wait $SUBPID || true
  echo "--- received ---"
  cat /tmp/recv.txt || true
'
echo

echo "== 8) Verdict =="
READY=$(kubectl -n "$NS_OMEGA" get po -l app="$DEP_OMEGA" -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
if grep -q "SYNC_READY" <(kubectl -n "$NS_OMEGA" logs -l app="$DEP_OMEGA" --tail=200); then
  echo "Ω received SYNC_READY ✅"
else
  echo "Ω did not log SYNC_READY ❌ (check ACLs and Ω logs)" 
fi
echo "Ω Ready status: $READY"
echo "Done."
