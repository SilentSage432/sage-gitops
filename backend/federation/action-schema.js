// Action schema definition for federation actions.
// Provides a structured way to define and validate actions.

import { randomUUID } from "crypto";

export function defineAction(type, payload = {}) {
  return {
    id: randomUUID(),
    type,
    payload,
    ts: Date.now(),
    state: "pending",
  };
}

