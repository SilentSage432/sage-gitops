/**
 * Phase 46 — Operator Memory Module
 *
 * Tracks recent engagement states over time to enable
 * memory-aware UI behavior without altering visuals.
 *
 * Silent + enterprise-grade.
 */

type EngagementLevel = "neutral" | "focused" | "overloaded";
type Trend = "stable" | "improving" | "declining";

interface StateRecord {
  state: EngagementLevel;
  ts: number;
}

class OperatorMemory {
  private recentStates: StateRecord[] = [];
  private maxHistory = 10;
  private currentTrend: Trend = "stable";

  recordState(engagementLevel: EngagementLevel): void {
    this.recentStates.push({
      state: engagementLevel,
      ts: Date.now(),
    });

    if (this.recentStates.length > this.maxHistory) {
      this.recentStates.shift();
    }

    this.calculateTrend();
  }

  private calculateTrend(): void {
    if (this.recentStates.length < 3) return;

    const lastThree = this.recentStates.slice(-3).map((s) => s.state);

    if (lastThree.every((s) => s === "focused")) {
      this.currentTrend = "improving";
    } else if (lastThree.every((s) => s === "overloaded")) {
      this.currentTrend = "declining";
    } else {
      this.currentTrend = "stable";
    }
  }

  getTrend(): Trend {
    return this.currentTrend;
  }
}

export const operatorMemory = new OperatorMemory();

