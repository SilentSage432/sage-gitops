# Arc Ω — Meaning Layer (Reason Codes)

## Purpose
Omega interprets raw events and telemetry into human-meaningful "Reason Codes" with severity, rationale, and remediation hints.

## Artifacts
- Namespace: `arc-omega`
- ConfigMap: `omega-reason-codes` (JSON map of codes)
- Deployment: `omega-monitor` (subscribes to Chi bus)
- Service: `omega-monitor` (HTTP health/metrics)
- NetPols: default-deny; allow DNS; allow Chi egress
- Chi ingress: `chi-bus-allow-omega` (permits arc-omega -> chi 4222)

## Expected Initial Codes
- OK, WARN, FAIL, RHO2_ENFORCING, SIGMA_BASELINE_OK, CHI_BUS_CONNECTED,
  LAMBDA_SEALED, THETA_PAUSED, OMEGA_REASON_INIT, DATA_FRESHNESS_STALE, HEALTH_DEGRADED

## Bring-up Checklist
1. Ensure Chi bus is reachable: `nats -s nats://chi-bus.arc-chi.svc:4222`
2. Apply manifests (Flux/GitOps will do this on commit).
3. Verify: `kubectl -n arc-omega get deploy,pod,svc,cm`
4. Health: GET `http://omega-monitor.arc-omega.svc:8080/health`
5. Confirm egress: `kubectl -n arc-omega exec -it <pod> -- wget -qO- chi-bus.arc-chi.svc.cluster.local:4222 || true`
6. Inspect Reason Codes: mounted at `/etc/omega/reason-codes.json`
