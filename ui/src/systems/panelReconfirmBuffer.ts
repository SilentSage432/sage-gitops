/**
 * Phase 54 — Reconfirmation Buffer
 *
 * Ensures triggers must persist before being allowed.
 * Prevents single-event execution.
 *
 * Output:
 *  - "confirmed"
 *  - "pending"
 *  - null (no trigger)
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type SafetyDecision = "allow" | "deny" | "defer";
type ReconfirmStatus = "confirmed" | "pending" | null;

class PanelReconfirmBuffer {
  private lastTrigger: PanelAction = null;
  private firstDetectedAt: number | null = null;
  private requiredDuration = 15000; // trigger must persist 15s

  update(trigger: PanelAction, safetyDecision: SafetyDecision): ReconfirmStatus {
    if (!trigger || safetyDecision !== "allow") {
      this.reset();
      return null;
    }

    const now = Date.now();

    // First time seeing this trigger
    if (this.lastTrigger !== trigger) {
      this.lastTrigger = trigger;
      this.firstDetectedAt = now;
      console.debug("[SAGE] Reconfirmation started:", trigger);
      return "pending";
    }

    // Check persistence duration
    if (this.firstDetectedAt && now - this.firstDetectedAt >= this.requiredDuration) {
      console.debug("[SAGE] Reconfirmation complete:", trigger);
      return "confirmed";
    }

    return "pending";
  }

  reset(): void {
    this.lastTrigger = null;
    this.firstDetectedAt = null;
  }
}

export const panelReconfirmBuffer = new PanelReconfirmBuffer();










