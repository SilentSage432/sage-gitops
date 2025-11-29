// Phase 19: Identity Acknowledgement & Session Modeling
// Passive operator session model
// Indicates that a verified assertion has been seen in THIS session only
// No authorization, no permissions, no system control - just session metadata

export interface OperatorSession {
  verified: boolean;
  ts: number | null;
}

let operatorSession: OperatorSession = {
  verified: false,
  ts: null,
};

// markOperatorVerified records that a verified assertion was seen in this session
// Does NOT grant authority, permissions, or access - just records the event
export function markOperatorVerified(): void {
  operatorSession.verified = true;
  operatorSession.ts = Date.now();
}

// getOperatorSession returns the current session state
export function getOperatorSession(): OperatorSession {
  return { ...operatorSession }; // Return copy to prevent external mutation
}

// clearOperatorSession resets the session (for testing or session expiry)
export function clearOperatorSession(): void {
  operatorSession.verified = false;
  operatorSession.ts = null;
}

