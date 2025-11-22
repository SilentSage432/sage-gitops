/**
 * Phase 65 — UI Execution Layer
 *
 * This phase performs the FIRST visible autonomous action:
 * opening a panel ONLY when:
 *  - confirmed
 *  - eligible
 *  - handshake approved
 *  - scheduler released
 *  - Rho² authority granted
 *
 * No unsolicited UI beyond this single controlled behavior.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;

class PanelUIExecution {
  private lastOpen: number | null = null;
  private cooldown = 30000; // prevents repetitive opening

  canOpen(): boolean {
    const now = Date.now();
    if (!this.lastOpen || now - this.lastOpen > this.cooldown) {
      this.lastOpen = now;
      return true;
    }
    return false;
  }

  open(action: PanelAction): void {
    if (!this.canOpen()) return;

    // Map panel actions to actual panel identifiers
    const panelMap: Record<string, string> = {
      open_system_health: "cognition", // System health monitoring via cognition panel
      open_activity_monitor: "agents", // Activity monitoring via agents panel
    };

    const panelId = panelMap[action];
    if (!panelId) return;

    // Dispatch UI action to open panel using existing event system
    window.dispatchEvent(
      new CustomEvent("SAGE_UI_ACTION", {
        detail: {
          action: "ui.surface.panel",
          payload: { panel: panelId },
        },
      })
    );

    switch (action) {
      case "open_system_health":
        console.debug("[SAGE] Autonomous UI action: SYSTEM HEALTH panel opened.");
        break;

      case "open_activity_monitor":
        console.debug("[SAGE] Autonomous UI action: ACTIVITY MONITOR panel opened.");
        break;

      default:
        break;
    }
  }
}

export const panelUIExecution = new PanelUIExecution();

