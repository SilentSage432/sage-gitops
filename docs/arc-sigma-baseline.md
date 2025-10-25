# Arc Sigma — Telemetry Baseline Activation
**Phase:** Federation Spine Hardening (Ω / Rho² / Σ / Θ)

## Overview
Arc Sigma establishes SAGE’s telemetry baseline — the EMA engine that tracks heartbeat cadence from Chi, Lambda, and Omega, so thresholds adapt instead of being static.

## Core Components
| Component | Namespace | Function |
|---|---|---|
| sigma-agent | arc-sigma | Reads beat timestamps, computes EMA, writes baseline. |
| omega-beats | arc-omega | Sidecar that writes chi_last_ms / lambda_last_ms. |
| sigma-baseline (CM) | sage-registry | Stores EMA values. |
| federation-arcs (CM) | sage-registry | Holds last heartbeat timestamps + omega_status. |

## Algorithm (EMA)
## Flow
1) Ω writes beats (~30s) → `federation-arcs` (`chi_last_ms`, `lambda_last_ms`).
2) Σ reads → computes Δ (ms) vs last seen.
3) Σ updates `sigma-baseline` with EMA.
4) Ω reason codes/agents consume baseline; Θ ensures DNS/egress OK.

## Validation
- Logs (every ~15s):  
  `sigma: TS chi=<ts> prev=<ts> d=<ms> | lam=<ts> prev=<ts> d=<ms> | ema chi=<ms> lam=<ms>`
- Baseline example:  
  `chi_interval_ms: "168000"  lambda_interval_ms: "168000"  window: "300"`

## Troubleshooting
- `no-progress … 0`: parser issue → use jq-based script (not sed).
- 403/000 from curl: fix RBAC/egress; use node-IP + `--resolve`.
- CrashLoop + chmod: don’t `chmod` a ConfigMap; run `sh /median/ema.sh`.

## Next
- Grafana panel for baseline drift.
- Feed EMA into Ω reason codes and alerting.
