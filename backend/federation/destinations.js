// Phase 71: Envelope Destinations
// Canonical set of destination types for execution envelopes
// Defines where an envelope can be routed:
// - local: keeps operation on the UI's node
// - prime: directs to SAGE Prime brain
// - operator: device routing
// - federation: multi-node routing

export const DESTINATIONS = [
  "local",
  "prime",
  "operator",
  "federation",
];

// We are not enabling them yet. Just defining them.
// Later:
// - federation will be multi-node routing
// - operator will be device routing
// - prime directs to SAGE Prime brain
// - local keeps the operation on the UI's node

export function isValidDestination(destination) {
  return DESTINATIONS.includes(destination);
}

export function getDefaultDestination() {
  return "local";
}

