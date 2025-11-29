// Action schema definition for federation actions.
// Provides a structured way to define and validate actions.

export function defineAction(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}

