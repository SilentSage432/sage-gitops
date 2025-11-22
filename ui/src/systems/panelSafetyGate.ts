/**
 * Phase 53 — Panel Safety Gate
 *
 * Validates whether an auto-open trigger is SAFE and ALLOWED.
 *
 * Output:
 *  - "allow"
 *  - "deny"
 *  - "defer"
 *
 * NO UI actions occur in this phase.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type SafetyDecision = "allow" | "deny" | "defer";

class PanelSafetyGate {
  private minimumConfidence = 1; // can adjust in future phases

  evaluateTrigger(trigger: PanelAction): SafetyDecision {
    if (!trigger) return "deny";

    // Severity mapping — internal only
    const map: Record<string, number> = {
      open_system_health: 3,     // highest severity
      open_activity_monitor: 1,  // low-priority
    };

    const severity = map[trigger] || 0;

    if (severity >= 3) return "allow";  // critical = safe to proceed
    if (severity === 1) return "defer"; // low-level = pause until reconfirmed

    return "deny";
  }
}

export const panelSafetyGate = new PanelSafetyGate();

