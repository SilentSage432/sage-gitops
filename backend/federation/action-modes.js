// Define conceptual execution modes — read-only for now.

export const actionModes = {
  "get-status": "read",
  "fetch-metrics": "read",
  "update-config": "maintenance",
  "deploy": "deployment",
  "restart": "orchestration",
};

export function getActionMode(type) {
  return actionModes[type] || "unknown";
}

