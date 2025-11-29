// Passive override rules. Does not enforce anything yet.

export const overrideRules = {
  "restart": "requires-confirmation",
  "deploy": "requires-confirmation",
};

export function requiresOverride(actionType) {
  return overrideRules[actionType] || null;
}

