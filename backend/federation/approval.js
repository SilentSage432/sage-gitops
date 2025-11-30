// Operator Approval - explicit consent requirement for execution
// Execution requires explicit operator approval even if all other conditions are met
// Still simulation only, no real approval UI yet

// In-memory approval store (simulation)
let approvedActions = {};

export function setApproval(action, approved) {
  if (!action || action === "none") {
    return false;
  }
  approvedActions[action] = approved;
  return true;
}

export function getApproval(action) {
  if (!action || action === "none") {
    return false;
  }
  return approvedActions[action] || false;
}

export function clearApproval(action) {
  if (action) {
    delete approvedActions[action];
  } else {
    approvedActions = {};
  }
}

export function getAllApprovals() {
  return { ...approvedActions };
}

