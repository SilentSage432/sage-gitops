/**
 * Phase 55 — Action Eligibility Engine
 *
 * Converts confirmed triggers into eligible actions
 * WITHOUT performing them.
 *
 * Output:
 *  - eligible action name
 *  - null (not eligible)
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;
type ReconfirmStatus = "confirmed" | "pending" | null;

class PanelEligibilityEngine {
  private currentEligible: PanelAction = null;

  update(reconfirmStatus: ReconfirmStatus, trigger: PanelAction): PanelAction {
    if (reconfirmStatus === "confirmed" && trigger) {
      this.currentEligible = trigger;
      console.debug("[SAGE] Action eligible:", trigger);
      return this.currentEligible;
    }

    this.currentEligible = null;
    return null;
  }

  getEligible(): PanelAction {
    return this.currentEligible;
  }

  clear(): void {
    this.currentEligible = null;
  }
}

export const panelEligibilityEngine = new PanelEligibilityEngine();







