// Phase 72: Destination Authorization
// Checks if a destination is allowed for an operator
// Simple policy now, will evolve later

export function isDestinationAllowed(destination, operator) {
  if (!destination || !operator) {
    return false;
  }

  if (destination === "local") return true;
  
  if (destination === "prime" && operator.role === "admin") return true;
  
  if (destination === "operator") return true;
  
  if (destination === "federation" && operator.canFederate) return true;
  
  return false;
}

