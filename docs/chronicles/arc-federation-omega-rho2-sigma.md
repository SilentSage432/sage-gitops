# Arc Federation Chronicle — Ω / Rho² / Σ Integration
Passphrase: SAGE_ARC_THETA_REPAIR_PHASE  
Recorded: 2025-10-19 (America/Boise)

## Summary
We stabilized the SAGE federation spine by advancing Ω (Freshness Gate), Rho² (NetworkPolicies), and Σ (Telemetry Baseline) while Θ (Network Sovereignty) remains paused pending host NAT/firewall. Chi (NATS), Lambda, and Omega now communicate by service DNS names under least-privilege policies.

## Arc Status
- Chi (χ): Message bus (NATS) — GREEN. Real NATS on 4222 (8222 optional). Service: chi-bus.arc-chi.svc
- Lambda (λ): Producers/consumers — GREEN. DNS + egress rules verified; ndots:2 → BUS_OK by name.
- Omega (Ω): Freshness gate — GREEN. Reads sigma-baseline and federation-arcs; shows Green with Chi/Lambda beats.
- Sigma (Σ): Telemetry baseline — GREEN. Agent maintains sigma-baseline (intervals/window).
- Rho² (ρ²): NetworkPolicies — GREEN. Minimal, least-privilege rules for DNS and Chi traffic.
- Theta (Θ): Network sovereignty — PAUSED. Waiting on NAT443 or DoH (Talos host firewall / SNAT).

## High-Impact Changes
1) Chi moved to real NATS (replaced netshoot). Verified listener at 0.0.0.0:4222.  
2) Lambda connectivity:
   - NetPolicies: lambda-allow-dns-egress → kube-dns:53; lambda-allow-chi-egress → chi-bus:4222/8222.
   - dnsConfig on clients: nameserver 10.96.0.10, searches <ns>.svc.cluster.local chain, ndots:2.
   - Verified BUS_OK via chi-bus.arc-chi.svc.
3) Omega clients aligned to same dnsConfig model.
4) CoreDNS interim path:
   - Forward “.” to cloudflared-doh:5355; temporary hosts pin for chi-bus until API watch fully synced.
   - Egress allows for CoreDNS to API VIP (10.96.0.1:443), node endpoint (192.168.1.117:6443), and cloudflared (5355).
5) Talos transport:
   - NAT shim with ip rule + fwmark to bypass Tailscale for 10.244/16 and 10.96/12; MASQUERADE confirmed.

## Proofs
- POD_OK: nc -zvw2 <chi-bus-pod-ip> 4222
- SVC_OK: nc -zvw2 $(kubectl -n arc-chi get svc chi-bus -o jsonpath='{.spec.clusterIP}') 4222
- BUS_OK: getent hosts chi-bus.arc-chi.svc.cluster.local; nc -zvw2 chi-bus.arc-chi.svc 4222

## Lessons
- Resolver tuning (ndots:2) avoided short-name resolver stalls.
- Rho² locks cross-arc traffic to DNS + bus only.
- Theta paused solely pending NAT/DoH proof.

## Next Steps
- Omega reason codes (flip explanations).
- Chi ACLs (NATS authorization.users + permissions).
- Unpause Theta once NAT443/DoH proofs succeed.
