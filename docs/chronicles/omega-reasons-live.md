# Ω Reason Codes — Conscious Awareness Achieved
- Switched Ω reason storage to **annotations** to avoid data clobbering
- Sidecar uses API VIP + BusyBox wget (no DNS, no external pulls)
- Writes: `metadata.annotations.omega_reason`, `metadata.annotations.omega_reason_epoch`
- Verified persistence across Ω registry writes and restarts
- This unlocks graded severities and richer operator visibility
