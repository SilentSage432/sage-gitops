// Execution Mode Framework - execution state control
// Defines execution modes: disabled, simulation, soft-mode, full-execution
// No action is possible yet. This phase just defines the rules and state.

// Execution mode state (default: disabled)
let executionMode = "disabled"; // disabled | simulation | soft-mode | full-execution

export function getExecutionMode() {
  return executionMode;
}

export function setExecutionMode(mode) {
  // Validate mode
  const validModes = ["disabled", "simulation", "soft-mode", "full-execution"];
  if (validModes.includes(mode)) {
    executionMode = mode;
    return true;
  }
  return false;
}

export function isExecutionEnabled() {
  return executionMode !== "disabled";
}

export function getModeDescription(mode) {
  const descriptions = {
    "disabled": "Execution completely disabled",
    "simulation": "Simulation mode - no real execution",
    "soft-mode": "Soft mode - validating but not committing",
    "full-execution": "Full execution mode - all actions allowed",
  };
  return descriptions[mode] || "Unknown mode";
}

