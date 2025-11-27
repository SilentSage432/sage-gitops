/**
 * Phase 58 — Rollback & Persistence Manager
 *
 * Ensures any autonomous execution is:
 *  1) monitored after execution
 *  2) reverted if conditions worsen
 *  3) confirmed stable before allowing new actions
 *
 * NO UI modifications.
 * Silent internal governance only.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";
type RollbackStatus = "stable" | "rollback" | "monitoring" | null;

class PanelRollbackManager {
  private activeAction: PanelAction = null;
  private executedAt: number | null = null;
  private monitorDuration = 20000; // 20s stability window

  track(action: PanelAction): void {
    this.activeAction = action;
    this.executedAt = Date.now();
    console.debug("[SAGE] Rollback monitoring started:", action);
  }

  evaluate(currentState: UXState): RollbackStatus {
    if (!this.activeAction || !this.executedAt) return null;

    const now = Date.now();

    // If stability window has passed → success
    if (now - this.executedAt >= this.monitorDuration) {
      console.debug("[SAGE] Autonomous action stable:", this.activeAction);
      this.reset();
      return "stable";
    }

    // If state worsens → rollback
    if (currentState === "preemptive_hold") {
      console.debug("[SAGE] Rollback triggered for:", this.activeAction);
      this.reset();
      return "rollback";
    }

    return "monitoring";
  }

  reset(): void {
    this.activeAction = null;
    this.executedAt = null;
  }
}

export const panelRollbackManager = new PanelRollbackManager();







