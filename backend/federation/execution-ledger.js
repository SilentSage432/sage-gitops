// Phase 79: Passive Execution Ledger
// Track all execution requests and pipeline results without executing anything
// Still: No commands run, No agent activity, No state changes, No enforcement
// We only record what would have happened.

// In-memory ledger store (simulation)
// Later this will be persisted to database
const ledger = [];

export function recordExecutionAttempt(record) {
  ledger.push({
    ...record,
    loggedAt: Date.now(),
  });
  
  // Optional: limit ledger size to prevent memory issues
  // Keep last 1000 entries for now
  if (ledger.length > 1000) {
    ledger.shift(); // Remove oldest entry
  }
}

export function getExecutionLedger() {
  return ledger;
}

export function clearExecutionLedger() {
  ledger.length = 0;
}

export function getLedgerEntry(id) {
  return ledger.find(entry => entry.id === id);
}

