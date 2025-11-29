// Read-only agent registry.

import { agentCapabilities } from "./agent-capabilities.js";

export const agents = [
  {
    name: "agent-alpha",
    status: "online",
    capabilities: agentCapabilities["agent-alpha"],
    role: "core",
  },
  {
    name: "agent-beta",
    status: "online",
    capabilities: agentCapabilities["agent-beta"],
    role: "edge",
  },
  {
    name: "agent-gamma",
    status: "offline",
    capabilities: agentCapabilities["agent-gamma"],
    role: "observer",
  },
];

export function listAgents() {
  return agents;
}

export function getAgent(name) {
  return agents.find(a => a.name === name);
}

// Simulation hints per role (no real enforcement)
export function getRoleSimulationProfile(role) {
  switch (role) {
    case "core":
      return { failureChance: 0.03, unreachableChance: 0.01, latencyBase: 5, latencyJitter: 15 };
    case "edge":
      return { failureChance: 0.12, unreachableChance: 0.08, latencyBase: 20, latencyJitter: 60 };
    case "observer":
      return { failureChance: 0.05, unreachableChance: 0.02, latencyBase: 10, latencyJitter: 25 };
    default:
      return { failureChance: 0.1, unreachableChance: 0.05, latencyBase: 15, latencyJitter: 40 };
  }
}

