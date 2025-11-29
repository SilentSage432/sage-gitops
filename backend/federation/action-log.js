// Action log - stores actions in memory for now.
// Phase 21: Action recording system.

const actions = [];

export function recordAction(action) {
  actions.push(action);
  return action;
}

export function listActions() {
  return [...actions];
}

export function getAction(id) {
  return actions.find(a => a.id === id);
}

