/**
 * Phase 50 — UX State Machine
 *
 * Establishes controlled UI behavior modes for federation readiness.
 * No visuals. No operator exposure. Silent internal governance.
 *
 * States:
 *  - baseline        (default)
 *  - stabilize       (reduced activity)
 *  - optimize        (elevated responsiveness)
 *  - preemptive_hold (prevents overload before it occurs)
 */

type UXState = "baseline" | "stabilize" | "optimize" | "preemptive_hold";
type Directive = "stabilize" | "optimize" | null;
type Projection = "risk_overload" | "sustain_focus" | null;

interface EvaluationInput {
  directive: Directive;
  projection: Projection;
}

class UXStateMachine {
  private currentState: UXState = "baseline";
  private lastStateChange: number | null = null;
  private cooldown = 20000; // prevents rapid state thrashing

  canTransition(): boolean {
    const now = Date.now();
    if (!this.lastStateChange || now - this.lastStateChange > this.cooldown) {
      this.lastStateChange = now;
      return true;
    }
    return false;
  }

  transition(nextState: UXState): void {
    if (!nextState || nextState === this.currentState) return;
    if (!this.canTransition()) return;

    this.currentState = nextState;

    console.debug(
      `[SAGE] UX state transition → ${this.currentState.toUpperCase()}`
    );
  }

  evaluate({ directive, projection }: EvaluationInput): void {
    // Federation-grade deterministic logic
    if (projection === "risk_overload") {
      this.transition("preemptive_hold");
      return;
    }

    if (directive === "stabilize") {
      this.transition("stabilize");
      return;
    }

    if (directive === "optimize") {
      this.transition("optimize");
      return;
    }

    this.transition("baseline");
  }

  getState(): UXState {
    return this.currentState;
  }
}

export const uxStateMachine = new UXStateMachine();

