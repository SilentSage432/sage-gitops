// Phase 80: Hardware Enforcement Path Introduced (but still disabled)
// Execution configuration - enforcement flags
// We're not enabling anything yet - just introducing the concept
// This is exactly how flight systems and Kubernetes admission controllers are built:
// the policy can exist without being active yet

export const enforcement = {
  requireHardware: false,
  requireApproval: false,
  requireFederationClearance: false,
};

export function getEnforcementConfig() {
  return { ...enforcement };
}

export function setEnforcementConfig(config) {
  Object.assign(enforcement, config);
  return { ...enforcement };
}

