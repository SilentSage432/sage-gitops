#!/usr/bin/env bash
set -euo pipefail

NS_ZETA=arc-zeta
NS_UI=arc-ui
NS_OMEGA=arc-omega
NS_CHI=arc-chi

SVC_WS=observer-api-ws      # correct WS service (port 8082)
SVC_UI=sage-enterprise-ui   # UI service (port 8080)
LOCAL_WS_PORT=18082         # avoid 8082 conflicts locally

log(){ printf "\033[1;36m[U3]\033[0m %s\n" "$*"; }

# --- 0) Sanity: services/ports exist ---
log "Checking Services in ${NS_ZETA}/${NS_UI}…"
kubectl -n "${NS_ZETA}" get svc "${SVC_WS}" -o jsonpath='{.spec.ports[0].port}'; echo
kubectl -n "${NS_UI}"   get svc "${SVC_UI}" -o jsonpath='{.spec.ports[0].port}'; echo

# --- 1) Kill any stale local port-forward on 8082/18082 cleanly ---
log "Freeing local WS port(s) 8082 and ${LOCAL_WS_PORT}…"
for P in 8082 "${LOCAL_WS_PORT}"; do
  PID="$(lsof -tiTCP:${P} -sTCP:LISTEN || true)"
  if [[ -n "${PID}" ]]; then
    log "Killing PID ${PID} on port ${P}"
    kill -9 "${PID}" || true
  fi
done

# --- 2) Start clean port-forwards (WS→18082, UI→8080) in background with PID files ---
log "Starting WS PF: localhost:${LOCAL_WS_PORT} → ${NS_ZETA}/${SVC_WS}:8082"
kubectl -n "${NS_ZETA}" port-forward svc/"${SVC_WS}" ${LOCAL_WS_PORT}:8082 >/tmp/zeta-ws.pf.log 2>&1 &
echo $! > /tmp/zeta-ws.pf.pid
sleep 2
log "WS PF PID: $(cat /tmp/zeta-ws.pf.pid) (ws://localhost:${LOCAL_WS_PORT}/ws)"

log "Starting UI PF: localhost:8080 → ${NS_UI}/${SVC_UI}:8080"
kubectl -n "${NS_UI}" port-forward svc/"${SVC_UI}" 8080:8080 >/tmp/ui.pf.log 2>&1 &
echo $! > /tmp/ui.pf.pid
sleep 2
log "UI PF PID:  $(cat /tmp/ui.pf.pid) (http://localhost:8080)"

# --- 3) Robust Ω pod exec (avoids 'container not found' during rotation) ---
omega_exec(){
  local cmd="$*"
  for i in {1..5}; do
    POD="$(kubectl -n "${NS_OMEGA}" get pods -l app=omega-monitor -o jsonpath='{.items[0].metadata.name}')"
    CONTAINERS="$(kubectl -n "${NS_OMEGA}" get pod "$POD" -o jsonpath='{.spec.containers[*].name}')"
    if echo "$CONTAINERS" | grep -qw monitor; then
      kubectl -n "${NS_OMEGA}" exec "$POD" -c monitor -- sh -lc "$cmd" && return 0
    fi
    sleep 1
  done
  return 1
}

log "(Optional) Checking Omega health endpoint (if enabled)…"
omega_exec 'wget -qO- http://localhost:8080/health || true; echo' || log "Omega health route not available (ok)"

# --- 4) Authenticated NATS publish test (fixes earlier unauthenticated timeout) ---
log "Publishing authenticated F2_TEST to omega.reason…"
SIGMA_USER="$(kubectl -n arc-sigma get secret nats-sigma -o jsonpath='{.data.NATS_USER}' | base64 -d)"
SIGMA_PASS="$(kubectl -n arc-sigma get secret nats-sigma -o jsonpath='{.data.NATS_PASS}' | base64 -d)"
CHI_IP="$(kubectl -n ${NS_CHI} get svc chi-bus -o jsonpath='{.spec.clusterIP}')"

# Fire and forget (no wait needed)
kubectl -n ${NS_CHI} run natsbox-u --restart=Never --image=synadia/nats-box:latest -- \
  sh -lc "nats pub -s nats://${SIGMA_USER}:${SIGMA_PASS}@${CHI_IP}:4222 omega.reason '{\"reason_code\":\"F2_TEST\",\"note\":\"manual\"}'" >/dev/null 2>&1 || true
sleep 2
kubectl -n ${NS_CHI} logs natsbox-u --tail=50 || true
kubectl -n ${NS_CHI} delete pod natsbox-u --now --ignore-not-found >/dev/null 2>&1 || true

# --- 5) Show recent Ω intake (HEARTBEAT / telemetry / F2_TEST) ---
log "Tailing recent Omega intake (HEARTBEAT / telemetry / F2_TEST)…"
kubectl -n "${NS_OMEGA}" logs deploy/omega-monitor --since=3m \
| egrep -i 'HEARTBEAT|sigma\.telemetry\.node|F2_TEST' || true

# --- 6) Final instructions for the browser Pulse card ---
log "Open UI:           http://localhost:8080"
log "Pulse WS endpoint: ws://localhost:${LOCAL_WS_PORT}/ws"
log "Stop PFs with:     kill \$(cat /tmp/zeta-ws.pf.pid) \$(cat /tmp/ui.pf.pid)"
