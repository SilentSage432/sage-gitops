// Operator Identity Session - identity dependency for execution gate
// Returns current authenticated operator identity with MFA status
// Still simulation-only, no real authentication yet

// In-memory operator session store (simulation)
let currentOperatorSession = null;

export function currentOperator() {
  // For now, simulate no operator authenticated
  // Later this will check real session/auth state
  if (!currentOperatorSession) {
    return null;
  }
  
  // Return operator with MFA status
  return {
    id: currentOperatorSession.id || currentOperatorSession.operatorId,
    mfa: currentOperatorSession.mfaVerified || false,
    timestamp: currentOperatorSession.timestamp || Date.now(),
  };
}

export function setOperator(operator) {
  // For testing/simulation - sets current operator
  // operator can have: { id, mfaVerified, timestamp }
  currentOperatorSession = operator;
}

export function clearOperator() {
  // Clears current operator session
  currentOperatorSession = null;
}

