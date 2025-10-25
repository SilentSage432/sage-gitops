# arc-lambda-locked — Rho² Security Pattern
**Goal:** Lambda can reach only DNS + Chi bus, and is blocked from kube-API (443/6443).
**Status:** Proven working with `API_NO`, `BUS_OK`, `/health` reachable via internal Service.
## Components
- Namespace `arc-lambda-locked` with PodSecurity `restricted`
- Egress default-deny + precise allows:
  - DNS (TCP/UDP 53) to kube-dns
  - Chi bus (TCP 4222) to `chi-bus` in `arc-chi`
- Lambda DaemonSet (hardened) + Service (TCP 8000)
- Chi-bus ingress NetworkPolicy (allow 4222/8222)
