// Command routing engine — NO dispatch or execution.

import { federationTopology } from "./topology.js";

export function routeAction(action) {
  const topo = federationTopology();

  // Default routing strategy:
  // If target specified -> direct
  // Else -> all nodes.

  const targets = action.payload?.target
    ? [action.payload.target]
    : topo.nodes;

  return {
    actionId: action.id,
    type: action.type,
    potentialTargets: targets,
    notes: "Routing only. No dispatch or execution.",
  };
}

