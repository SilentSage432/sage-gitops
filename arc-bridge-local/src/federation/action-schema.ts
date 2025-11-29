// Phase 20: Action Plane Scaffolding
// Defines what an action looks like without enabling it
// Still NO execution, NO dispatch, NO control
import { randomUUID } from "crypto";
import type { ActionType } from "./action-types.js";

export interface ActionSchema {
  id: string;
  type: ActionType;
  payload: Record<string, unknown>;
  ts: number;
  target?: string; // Optional target node/agent
  channel?: string; // Optional routing channel
}

// defineAction creates an action schema without executing it
// This is just the blueprint - no machinery, no execution, no dispatch
export function defineAction(
  type: ActionType,
  payload: Record<string, unknown>,
  options?: {
    target?: string;
    channel?: string;
  }
): ActionSchema {
  return {
    id: randomUUID(),
    type,
    payload,
    ts: Date.now(),
    target: options?.target,
    channel: options?.channel,
  };
}

