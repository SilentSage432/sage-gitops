/**
 * Phase 59 — Autonomous Execution Scheduler
 *
 * Controls WHEN autonomous actions are allowed to execute,
 * preventing overlap, repetition, and cascading behavior.
 *
 * This ensures:
 *  - only one autonomous action runs at a time
 *  - enforced cooldown between executions
 *  - future actions are queued, not lost
 */

type PanelAction = "open_system_health" | "open_activity_monitor" | null;

class PanelExecutionScheduler {
  private globalCooldown = 30000; // 30s system-wide cooldown
  private lastExecution: number | null = null;
  private queue: PanelAction[] = [];
  private isExecuting = false;

  enqueue(action: PanelAction): void {
    if (!action) return;
    this.queue.push(action);
    console.debug("[SAGE] Action queued:", action);
  }

  peek(): PanelAction | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  canRun(): boolean {
    const now = Date.now();
    if (!this.lastExecution || now - this.lastExecution > this.globalCooldown) {
      return true;
    }
    return false;
  }

  next(): PanelAction | null {
    if (this.isExecuting) return null;
    if (!this.canRun()) return null;

    const nextAction = this.queue.shift();
    if (!nextAction) return null;

    this.isExecuting = true;
    this.lastExecution = Date.now();

    console.debug("[SAGE] Scheduler releasing action:", nextAction);
    return nextAction;
  }

  complete(): void {
    this.isExecuting = false;
  }

  getIsExecuting(): boolean {
    return this.isExecuting;
  }
}

export const panelExecutionScheduler = new PanelExecutionScheduler();

