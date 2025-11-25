/**
 * Genesis State Machine
 * Deterministic state machine for agent genesis workflow
 */

import { GenesisState, GenesisEvent } from "../types/agentManifest";

/**
 * Determines the next state based on current state and event
 * @param currentState - Current state of the genesis workflow
 * @param event - The genesis event that occurred
 * @returns The next state
 */
export function next(currentState: GenesisState, event: GenesisEvent): GenesisState {
  switch (currentState) {
    case "draft":
      if (event.type === "agent.genesis.status" && event.status === "validating") {
        return "validating";
      }
      return currentState;

    case "validating":
      if (event.type === "agent.genesis.status") {
        if (event.status === "forging") {
          return "forging";
        }
        if (event.status === "failed") {
          return "failed";
        }
      }
      return currentState;

    case "forging":
      if (event.type === "agent.genesis.status") {
        if (event.status === "deploying") {
          return "deploying";
        }
        if (event.status === "failed") {
          return "failed";
        }
      }
      return currentState;

    case "deploying":
      if (event.type === "agent.genesis.completed") {
        return "completed";
      }
      if (event.type === "agent.genesis.failed") {
        return "failed";
      }
      if (event.type === "agent.genesis.status" && event.status === "completed") {
        return "completed";
      }
      if (event.type === "agent.genesis.status" && event.status === "failed") {
        return "failed";
      }
      return currentState;

    case "completed":
    case "failed":
      // Terminal states - no transitions
      return currentState;

    default:
      return currentState;
  }
}

/**
 * Checks if a state is a terminal state
 */
export function isTerminalState(state: GenesisState): boolean {
  return state === "completed" || state === "failed";
}

/**
 * Gets the human-readable label for a state
 */
export function getStateLabel(state: GenesisState): string {
  const labels: Record<GenesisState, string> = {
    draft: "Draft",
    validating: "Validating",
    forging: "Forging",
    deploying: "Deploying",
    completed: "Completed",
    failed: "Failed",
  };
  return labels[state] || state;
}

