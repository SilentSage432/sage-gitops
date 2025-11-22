/**
 * Phase 53 — Panel Auto-Open Execution Engine
 *
 * Executes panel auto-opening actions based on Phase 52 triggers.
 * Dispatches UI actions to surface panels when conditions are met.
 *
 * Silent + controlled execution.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;

class PanelAutoOpenEngine {
  private lastExecution: number | null = null;
  private cooldown = 25000; // prevents rapid panel opening

  canExecute(): boolean {
    const now = Date.now();
    if (!this.lastExecution || now - this.lastExecution > this.cooldown) {
      this.lastExecution = now;
      return true;
    }
    return false;
  }

  execute(action: PanelAction): void {
    if (!action || !this.canExecute()) return;

    // Map panel actions to actual panel identifiers
    const panelMap: Record<string, string> = {
      open_system_health: "cognition", // System health monitoring via cognition panel
      open_activity_monitor: "agents", // Activity monitoring via agents panel
    };

    const panelId = panelMap[action];
    if (!panelId) return;

    // Dispatch UI action to open panel
    window.dispatchEvent(
      new CustomEvent("SAGE_UI_ACTION", {
        detail: {
          action: "ui.surface.panel",
          payload: { panel: panelId },
        },
      })
    );

    console.debug(`[SAGE] Auto-open execution: ${panelId} panel opened.`);
  }
}

export const panelAutoOpenEngine = new PanelAutoOpenEngine();

