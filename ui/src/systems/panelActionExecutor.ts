/**
 * Phase 57 — Panel Action Executor (Internal Only)
 *
 * This is the FIRST phase where autonomous actions
 * are actually executed — but ONLY internally.
 *
 * NO UI changes occur here.
 * NO panels open yet.
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;

class PanelActionExecutor {
  private lastExecution: number | null = null;
  private cooldown = 15000; // ensures safety pacing
  private rollbackManager: { track: (action: PanelAction) => void } | null = null;
  private isExecuting = false;

  setRollbackManager(manager: { track: (action: PanelAction) => void }): void {
    this.rollbackManager = manager;
  }

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

    this.isExecuting = true;

    switch (action) {
      case "open_system_health":
        this.runSystemHealthCheck();
        break;

      case "open_activity_monitor":
        this.runActivityAnalysis();
        break;

      default:
        break;
    }

    // Phase 58 — Track execution for rollback monitoring
    if (this.rollbackManager) {
      this.rollbackManager.track(action);
    }

    // Reset execution flag after a short delay
    setTimeout(() => {
      this.isExecuting = false;
    }, 1000);
  }

  getIsExecuting(): boolean {
    return this.isExecuting;
  }

  // INTERNAL ONLY — no UI interaction
  private runSystemHealthCheck(): void {
    console.debug("[SAGE] Autonomous action executed: System health evaluation started.");
  }

  private runActivityAnalysis(): void {
    console.debug("[SAGE] Autonomous action executed: Activity analysis initiated.");
  }
}

export const panelActionExecutor = new PanelActionExecutor();

