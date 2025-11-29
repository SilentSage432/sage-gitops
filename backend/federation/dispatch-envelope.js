// Dispatch envelope ONLY. Does not send anything yet.

export function buildDispatchEnvelope(action, targets) {
  return {
    actionId: action.id,
    type: action.type,
    payload: action.payload,
    targets,
    ts: Date.now(),
    note: "Dispatch disabled. Envelope only.",
  };
}

