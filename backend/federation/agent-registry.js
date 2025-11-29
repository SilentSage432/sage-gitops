// Read-only agent registry.

import { agentCapabilities } from "./agent-capabilities.js";

export const agents = [
  {
    name: "agent-alpha",
    status: "online",
    capabilities: agentCapabilities["agent-alpha"],
  },
  {
    name: "agent-beta",
    status: "online",
    capabilities: agentCapabilities["agent-beta"],
  },
  {
    name: "agent-gamma",
    status: "offline",
    capabilities: agentCapabilities["agent-gamma"],
  },
];

export function listAgents() {
  return agents;
}

export function getAgent(name) {
  return agents.find(a => a.name === name);
}

