/**
 * Phase 47 — Contextual System Prompt Engine
 *
 * Generates internal guidance signals based on:
 *  - Operator engagement level (Phase 45)
 *  - Trend memory (Phase 46)
 *
 * Zero UI output — internal only.
 * No intrusive behavior.
 */

type EngagementLevel = "neutral" | "focused" | "overloaded";
type Trend = "stable" | "improving" | "declining";
type PromptResult = "stabilize" | "optimize" | null;

interface EvaluationContext {
  engagementLevel: EngagementLevel;
  trend: Trend;
}

class ContextPromptEngine {
  private lastPromptTs: number | null = null;
  private cooldown = 15000; // 15s internal safety window

  shouldEmit(): boolean {
    const now = Date.now();
    if (!this.lastPromptTs || now - this.lastPromptTs > this.cooldown) {
      this.lastPromptTs = now;
      return true;
    }
    return false;
  }

  evaluate({ engagementLevel, trend }: EvaluationContext): PromptResult {
    if (!this.shouldEmit()) return null;

    if (trend === "declining" && engagementLevel === "overloaded") {
      return "stabilize"; // system reduces demand silently
    }

    if (trend === "improving" && engagementLevel === "focused") {
      return "optimize"; // system may increase efficiency
    }

    return null;
  }
}

export const contextPromptEngine = new ContextPromptEngine();

