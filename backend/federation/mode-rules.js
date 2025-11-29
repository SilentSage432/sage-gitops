// Simulation-only mode rules. No execution allowed.

export function evaluateModeRules(mode) {
  switch (mode) {
    case "read":
      return { allowed: true, requiresConsent: false };

    case "maintenance":
      return { allowed: true, requiresConsent: true };

    case "deployment":
    case "orchestration":
      return { allowed: true, requiresConsent: true };

    default:
      return { allowed: false, requiresConsent: true };
  }
}

