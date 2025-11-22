/**
 * Phase 45 — Operator Cognitive Sync
 * SAGE begins adapting UI behavior based on the operator (Tyson),
 * using real interaction patterns rather than passive system signals.
 *
 * Enterprise-grade design — no visual gimmicks.
 */

interface OperatorProfile {
  inputPace: number[];
  averagePace: number | null;
  lastInputTimestamp: number | null;
  engagementLevel: "neutral" | "focused" | "overloaded";
}

type EngagementCallback = (profile: OperatorProfile) => void;

class OperatorCognitiveSync {
  private operatorProfile: OperatorProfile = {
    inputPace: [],
    averagePace: null,
    lastInputTimestamp: null,
    engagementLevel: "neutral",
  };

  private subscribers: EngagementCallback[] = [];

  recordInputEvent(): void {
    const now = Date.now();

    if (this.operatorProfile.lastInputTimestamp) {
      const delta = now - this.operatorProfile.lastInputTimestamp;
      this.operatorProfile.inputPace.push(delta);

      if (this.operatorProfile.inputPace.length > 5) {
        this.operatorProfile.inputPace.shift();
      }

      this.operatorProfile.averagePace =
        this.operatorProfile.inputPace.reduce((a, b) => a + b, 0) /
        this.operatorProfile.inputPace.length;

      this.updateEngagementState();
      this.notifySubscribers();
    }

    this.operatorProfile.lastInputTimestamp = now;
  }

  private updateEngagementState(): void {
    const pace = this.operatorProfile.averagePace;

    if (!pace) return;

    if (pace < 900) {
      this.operatorProfile.engagementLevel = "focused";
    } else if (pace > 2500) {
      this.operatorProfile.engagementLevel = "overloaded";
    } else {
      this.operatorProfile.engagementLevel = "neutral";
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb(this.operatorProfile));
  }

  subscribe(callback: EngagementCallback): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  getProfile(): OperatorProfile {
    return { ...this.operatorProfile };
  }
}

export const operatorCognitiveSync = new OperatorCognitiveSync();

