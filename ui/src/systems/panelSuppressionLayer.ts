/**
 * Phase 61 — Autonomous Suppression Layer
 *
 * Suppresses low-priority actions when system state requires stability.
 *
 * Suppression rules:
 *  - If state = preemptive_hold → block ALL non-critical actions
 *  - If escalation is active → allow only critical path
 *
 * NO UI behavior. Silent internal logic only.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";

class PanelSuppressionLayer {
  private suppressed = false;

  shouldSuppress(action: PanelAction, state: UXState, priority: number): boolean {
    // If system is in preventive hold → allow ONLY critical
    if (state === "preemptive_hold" && priority < 3) {
      this.suppressed = true;
      console.debug("[SAGE] Suppression active — blocking:", action);
      return true;
    }

    // reset when state normalizes
    this.suppressed = false;
    return false;
  }

  isSuppressed(): boolean {
    return this.suppressed;
  }
}

export const panelSuppressionLayer = new PanelSuppressionLayer();

