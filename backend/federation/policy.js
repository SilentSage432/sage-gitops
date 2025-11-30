// Execution Policy - federation rules for action eligibility
// Defines which roles, tenants, and agents are permitted for actions
// Still simulation-only, no real enforcement yet

export function getPolicyFor(action) {
  if (!action || action === "none") {
    return {
      action: null,
      allowedRoles: [],
      allowedTenants: [],
      forbiddenAgents: [],
      requirements: [],
    };
  }

  // Simulation-only policy definitions
  // Later this will be more sophisticated and loaded from config/database
  
  const policyMap = {
    "get-status": {
      allowedRoles: ["operator", "viewer", "sovereign"],
      allowedTenants: ["root", "*"],
      forbiddenAgents: [],
      requirements: ["identity"],
    },
    "fetch-metrics": {
      allowedRoles: ["operator", "viewer", "sovereign"],
      allowedTenants: ["root", "*"],
      forbiddenAgents: [],
      requirements: ["identity"],
    },
    "update-config": {
      allowedRoles: ["operator", "sovereign"],
      allowedTenants: ["root"],
      forbiddenAgents: [],
      requirements: ["identity", "mfa"],
    },
    "deploy": {
      allowedRoles: ["sovereign"],
      allowedTenants: ["root"],
      forbiddenAgents: [],
      requirements: ["identity", "mfa", "approval"],
    },
    "restart": {
      allowedRoles: ["operator", "sovereign"],
      allowedTenants: ["root"],
      forbiddenAgents: [],
      requirements: ["identity", "mfa"],
    },
  };

  // Default policy for unknown actions
  const defaultPolicy = {
    allowedRoles: ["sovereign"],
    allowedTenants: ["root"],
    forbiddenAgents: [],
    requirements: ["identity", "mfa", "approval"],
  };

  const policy = policyMap[action] || defaultPolicy;

  return {
    action,
    ...policy,
  };
}

