// Phase 17.2: Backend Operator Identity Model
// Passive Operator identity model
// Does NOT perform authentication or access control yet
// This is just the representation - the slot where operator identity will live

export interface OperatorIdentity {
  id: string;
  source: string; // "webauthn" | "yubikey" | etc.
  registeredAt: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

let operator: OperatorIdentity | null = null;

// registerOperator stores the operator identity
// No authentication, no enforcement, no action - just storage
export function registerOperator(op: Omit<OperatorIdentity, "registeredAt" | "lastSeen">): void {
  operator = {
    ...op,
    registeredAt: Date.now(),
    lastSeen: Date.now(),
  };
}

// getOperator returns the current operator identity (if any)
// Returns null if no operator is registered
export function getOperator(): OperatorIdentity | null {
  return operator;
}

// updateOperatorPresence updates the lastSeen timestamp
// No side effects, no actions - just timestamp update
export function updateOperatorPresence(): void {
  if (operator) {
    operator.lastSeen = Date.now();
  }
}

