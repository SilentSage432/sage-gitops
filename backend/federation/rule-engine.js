import { getEligibleAgents } from "./capability-matcher.js";
import { getSafetyLevel } from "./action-safety.js";
import { getPrivilegeLevel } from "./action-privileges.js";
import { getRolePrivileges } from "./role-privileges.js";
import { getActionMode } from "./action-modes.js";

// Read-only evaluation — no enforcement.

export function evaluateAction(action, role = "sovereign") {
  const eligible = getEligibleAgents(action.type);
  const safety = getSafetyLevel(action.type);
  const privilege = getPrivilegeLevel(action.type);
  const allowedPrivileges = getRolePrivileges(role);
  const mode = getActionMode(action.type);

  return {
    ok: true,            // still read-only
    eligibleAgents: eligible,
    safety,
    privilege,
    mode,
    permitted: allowedPrivileges.includes(privilege),
    reason: {
      capabilities: eligible.length
        ? "Eligible agents found"
        : "No eligible agents",
      privilege: allowedPrivileges.includes(privilege)
        ? "Privilege allowed"
        : "Privilege mismatch",
      safety,
      mode,
    },
  };
}

