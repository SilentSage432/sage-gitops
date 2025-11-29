import { ACTION_TYPES } from "./action-types.js";
import { federationTopology } from "./topology.js";

// Passive action validation. No execution allowed.
export function validateAction(action) {
  const errors = [];

  // action type must be valid
  if (!ACTION_TYPES.includes(action.type)) {
    errors.push(`Invalid action type: ${action.type}`);
  }

  // payload must be an object
  if (typeof action.payload !== "object") {
    errors.push("Invalid payload format");
  }

  // if a node is targeted, it must exist
  const topo = federationTopology();
  if (action.payload?.target && !topo.nodes.includes(action.payload.target)) {
    errors.push(`Unknown node: ${action.payload.target}`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

