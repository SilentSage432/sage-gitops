// Command routing engine — NO dispatch or execution.

import { getEligibleAgents } from "./capability-matcher.js";
import { getSafetyLevel } from "./action-safety.js";
import { getPrivilegeLevel } from "./action-privileges.js";
import { getRolePrivileges } from "./role-privileges.js";

export function routeAction(action, role = "sovereign") {
  const eligible = getEligibleAgents(action.type);
  const safety = getSafetyLevel(action.type);
  const privilege = getPrivilegeLevel(action.type);
  const permittedRoles = getRolePrivileges(role);

  return {
    action,
    actionId: action.id,
    type: action.type,
    potentialTargets: eligible.map(a => a.name),
    reason: eligible.length
      ? "Matched by capability model"
      : "No capability match found",
    safety,
    privilege,
    permittedRoles,
    notes: "Routing only. No dispatch or execution.",
  };
}

