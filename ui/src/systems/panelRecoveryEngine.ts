/**
 * Phase 62 — Autonomous Recovery Engine
 *
 * When suppression has been active, SAGE will:
 *  1) monitor for stabilization
 *  2) automatically re-enable normal autonomous execution
 *
 * Ensures the system NEVER gets stuck in a suppressed state.
 * Silent internal logic — NO UI effects.
 */

type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";
type RecoveryStatus = "suppressed" | "recovering" | "restored";

class PanelRecoveryEngine {
  private stableWindow = 15000; // 15s stability required
  private stableSince: number | null = null;

  update(state: UXState, suppressed: boolean): RecoveryStatus {
    // If suppression still active — reset stability timer
    if (suppressed || state === "preemptive_hold") {
      this.stableSince = null;
      return "suppressed";
    }

    // If transitioning back to normal — begin tracking stability
    if (!this.stableSince) {
      this.stableSince = Date.now();
      console.debug("[SAGE] Recovery tracking started.");
      return "recovering";
    }

    const now = Date.now();

    // If stability window complete — safe to normalize
    if (now - this.stableSince >= this.stableWindow) {
      console.debug("[SAGE] System recovered — restoring autonomy.");
      this.stableSince = null;
      return "restored";
    }

    return "recovering";
  }
}

export const panelRecoveryEngine = new PanelRecoveryEngine();

