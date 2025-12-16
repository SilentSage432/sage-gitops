/**
 * Phase 56 — Execution Handshake Layer
 *
 * Prevents autonomous actions from executing
 * until BOTH:
 *  1) eligibility is confirmed (Phase 55)
 *  2) handshake validates operational safety
 *
 * Output:
 *  - "approved"
 *  - "blocked"
 *  - null (no action)
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type HandshakeDecision = "approved" | "blocked" | null;

class PanelExecutionHandshake {
  private lastCheck: number | null = null;
  private cooldown = 12000; // prevents rapid approval attempts

  canCheck(): boolean {
    const now = Date.now();
    if (!this.lastCheck || now - this.lastCheck > this.cooldown) {
      this.lastCheck = now;
      return true;
    }
    return false;
  }

  approve(eligibleAction: PanelAction): HandshakeDecision {
    if (!eligibleAction || !this.canCheck()) {
      return null;
    }

    // Enterprise rule:
    // Only highest-severity actions qualify at this phase
    const highSeverity = eligibleAction === "open_system_health";

    if (highSeverity) {
      console.debug("[SAGE] Execution handshake APPROVED:", eligibleAction);
      return "approved";
    }

    console.debug("[SAGE] Execution handshake BLOCKED:", eligibleAction);
    return "blocked";
  }
}

export const panelExecutionHandshake = new PanelExecutionHandshake();










