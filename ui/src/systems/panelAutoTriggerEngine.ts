/**
 * Phase 52 — Panel Auto-Open Trigger Engine
 *
 * Determines when SAGE SHOULD auto-open a panel
 * based on internal UX state + predictive flags.
 *
 * NO UI actions are executed in this phase.
 */

type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";
type Projection = "risk_overload" | "sustain_focus" | null;
type PanelAction = "open_system_health" | "open_activity_monitor" | null;

interface EvaluationInput {
  state: UXState;
  projection: Projection;
}

class PanelAutoTriggerEngine {
  private lastTrigger: number | null = null;
  private cooldown = 20000; // prevents rapid triggers
  private pendingAction: PanelAction = null;

  canTrigger(): boolean {
    const now = Date.now();
    if (!this.lastTrigger || now - this.lastTrigger > this.cooldown) {
      this.lastTrigger = now;
      return true;
    }
    return false;
  }

  evaluate({ state, projection }: EvaluationInput): PanelAction {
    if (!this.canTrigger()) return null;

    // High-risk condition
    if (projection === "risk_overload" && state === "preemptive_hold") {
      this.pendingAction = "open_system_health";
      console.debug("[SAGE] Auto-open trigger: SYSTEM HEALTH panel flagged.");
      return this.pendingAction;
    }

    // Optimization condition
    if (state === "optimize") {
      this.pendingAction = "open_activity_monitor";
      console.debug("[SAGE] Auto-open trigger: ACTIVITY MONITOR flagged.");
      return this.pendingAction;
    }

    this.pendingAction = null;
    return null;
  }

  consume(): PanelAction {
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
  }
}

export const panelAutoTriggerEngine = new PanelAutoTriggerEngine();

