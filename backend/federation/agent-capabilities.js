// Read-only capability model for federation agents

export const agentCapabilities = {
  "agent-alpha": ["metrics", "status", "deploy"],
  "agent-beta": ["backup", "storage"],
  "agent-gamma": ["network", "telemetry"],
};

export function getCapabilities(agentName) {
  return agentCapabilities[agentName] || [];
}

