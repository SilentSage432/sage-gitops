// Action schema definition for federation actions.
// Provides a structured way to define and validate actions.

export function defineAction(type, payload = {}) {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}

