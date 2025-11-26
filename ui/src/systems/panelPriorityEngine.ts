/**
 * Phase 60 — Panel Priority & Escalation Engine
 *
 * Determines action priority and escalation behavior:
 *
 * Priority Levels:
 *  - critical (3)
 *  - elevated (2)
 *  - routine  (1)
 *
 * Escalation triggers only when:
 *  - critical action repeats
 *  - state degradation continues
 *
 * NO UI modifications.
 * Silent internal governance only.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";

class PanelPriorityEngine {
  private priorityMap: Record<string, number> = {
    open_system_health: 3,     // critical
    open_activity_monitor: 1,  // routine
  };

  private lastCritical: number | null = null;
  private escalationWindow = 30000; // 30s window

  getPriority(action: PanelAction): number {
    if (!action) return 0;
    return this.priorityMap[action] || 0;
  }

  shouldEscalate(action: PanelAction, currentState: UXState): boolean {
    const priority = this.getPriority(action);

    // only critical actions are candidates
    if (priority !== 3) return false;

    const now = Date.now();

    // first detection
    if (!this.lastCritical) {
      this.lastCritical = now;
      return false;
    }

    // if critical action repeats inside window
    if (now - this.lastCritical <= this.escalationWindow) {
      // escalate only if state is worsening
      return currentState === "preemptive_hold";
    }

    // reset if window has passed
    this.lastCritical = now;
    return false;
  }
}

export const panelPriorityEngine = new PanelPriorityEngine();






