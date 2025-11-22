/**
 * Phase 63 — Integrity Verification Engine
 *
 * Ensures the autonomous pipeline NEVER enters:
 *  - contradictory states
 *  - corrupted execution chains
 *  - deadlocked suppression
 *  - invalid eligibility conditions
 *
 * If inconsistency is detected, SAGE performs a safe reset
 * of ONLY the autonomous pipeline — NOT the UI.
 *
 * NO visual changes. Silent internal protection.
 */

import { panelEligibilityEngine } from "./panelEligibilityEngine";
import { panelExecutionScheduler } from "./panelExecutionScheduler";
import { panelSafetyGate } from "./panelSafetyGate";

type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";
type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type IntegrityResult = "skipped" | "corrected" | "clean";

interface ValidationInput {
  state: UXState;
  suppressed: boolean;
  eligible: PanelAction;
  executing: boolean;
}

class PanelIntegrityVerifier {
  private lastCheck: number | null = null;
  private cooldown = 10000;

  canCheck(): boolean {
    const now = Date.now();
    if (!this.lastCheck || now - this.lastCheck > this.cooldown) {
      this.lastCheck = now;
      return true;
    }
    return false;
  }

  validate({ state, suppressed, eligible, executing }: ValidationInput): IntegrityResult {
    if (!this.canCheck()) return "skipped";

    // ✅ Impossible state #1:
    // suppressed but low-priority eligible action exists
    if (suppressed && eligible && state === "preemptive_hold") {
      console.debug("[SAGE] Integrity correction: clearing invalid eligibility.");
      panelEligibilityEngine.clear();
      return "corrected";
    }

    // ✅ Impossible state #2:
    // executor running but scheduler locked
    if (executing && panelExecutionScheduler.getIsExecuting() && suppressed) {
      console.debug("[SAGE] Integrity correction: forcing scheduler release.");
      panelExecutionScheduler.complete();
      return "corrected";
    }

    // ✅ Impossible state #3:
    // reconfirmed action but safety now denies it
    const safety = panelSafetyGate.evaluateTrigger(eligible);
    if (eligible && safety !== "allow") {
      console.debug("[SAGE] Integrity correction: invalid post-confirmation action reset.");
      panelEligibilityEngine.clear();
      return "corrected";
    }

    return "clean";
  }
}

export const panelIntegrityVerifier = new PanelIntegrityVerifier();

