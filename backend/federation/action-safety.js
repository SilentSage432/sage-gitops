// Risk and safety classification (no enforcement)

export const safetyLevels = {
  "get-status": "safe",
  "fetch-metrics": "safe",
  "deploy": "elevated",
  "update-config": "moderate",
  "restart": "high",
};

export function getSafetyLevel(actionType) {
  return safetyLevels[actionType] || "unknown";
}

