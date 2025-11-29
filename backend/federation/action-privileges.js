// Privilege classification for actions (read-only)

export const privilegeLevels = {
  "get-status": "user",
  "fetch-metrics": "user",
  "update-config": "operator",
  "deploy": "operator",
  "restart": "sovereign",
};

export function getPrivilegeLevel(actionType) {
  return privilegeLevels[actionType] || "unknown";
}

