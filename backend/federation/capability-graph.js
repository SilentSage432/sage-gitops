import { agents } from "./agent-registry.js";

export function buildCapabilityGraph() {
  return agents.map(agent => ({
    agent: agent.name,
    role: agent.role,
    capabilities: agent.capabilities,
    status: agent.status,
  }));
}

