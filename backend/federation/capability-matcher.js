// Match action types to capable agents.

import { listAgents } from "./agent-registry.js";

export function getEligibleAgents(actionType) {
  const agents = listAgents();

  return agents.filter(agent =>
    agent.capabilities.includes(actionType)
  );
}

