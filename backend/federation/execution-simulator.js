// Phase 78: Passive Enforcement Simulation
// Phase 80: Extended with enforcement awareness
// Unifies destination rules, hardware rules, mode rules, approval, policy, identity
// into one simulation result - a dry-run of execution legality
// This is extremely important:
// We do NOT use this result for the execution gate yet
// We do NOT block anything
// We do NOT modify routing
// We only return the full decision object

import { enforcement } from "./execution-config.js";

export function simulateExecution(envelope, gate, hardwareAllowed) {
  const reasons = [];
  
  // Check operator identity
  if (!gate.operator) {
    reasons.push("no operator identity");
  }
  
  // Check mode validity
  const modeValid = gate.requirements?.mode?.satisfied || false;
  if (!modeValid) {
    reasons.push("invalid mode");
  }
  
  // Check policy validity
  const policyValid = gate.requirements?.policy?.satisfied || false;
  if (!policyValid) {
    reasons.push("policy failed");
  }
  
  // Check approval validity
  const approvalValid = gate.requirements?.approval?.satisfied || false;
  if (!approvalValid) {
    reasons.push("approval missing");
  }
  
  // Check hardware validity for destination
  if (!hardwareAllowed) {
    reasons.push("hardware not valid for destination");
  }
  
  // Check identity validity
  const identityValid = gate.requirements?.identity?.satisfied || false;
  if (!identityValid) {
    reasons.push("identity not satisfied");
  }
  
  // Check destination validity (if available)
  // This would come from the envelope check result if we have it
  
  const allowed = reasons.length === 0;
  
  return {
    simulate: true,
    allowed,
    reasons,
    checks: {
      operator: !!gate.operator,
      identity: identityValid,
      mode: modeValid,
      policy: policyValid,
      approval: approvalValid,
      hardware: hardwareAllowed,
    },
    enforcementActive: enforcement.requireHardware, // Phase 80: Enforcement awareness
    timestamp: Date.now(),
  };
}

