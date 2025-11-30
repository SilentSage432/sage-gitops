// Operator Identity Session - identity dependency for execution gate
// Returns current authenticated operator identity
// Still simulation-only, no real authentication yet

// In-memory operator session store (simulation)
let currentOperatorSession = null;

export function currentOperator() {
  // For now, simulate no operator authenticated
  // Later this will check real session/auth state
  return currentOperatorSession;
}

export function setOperator(operator) {
  // For testing/simulation - sets current operator
  currentOperatorSession = operator;
}

export function clearOperator() {
  // Clears current operator session
  currentOperatorSession = null;
}

