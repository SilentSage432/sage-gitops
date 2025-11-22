export interface RecoveryEvent {
  level: "SOFT" | "HARD";
  reason: string;
  timestamp: number;
}

const MAX_HISTORY = 20;
let history: RecoveryEvent[] = [];

export function recordRecovery(event: RecoveryEvent) {
  history.push(event);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
}

export function getRecoveryHistory() {
  return [...history];
}

export function detectRecurringPattern(windowMs = 30000, threshold = 3) {
  const cutoff = Date.now() - windowMs;
  const recent = history.filter((e) => e.timestamp >= cutoff);
  return recent.length >= threshold;
}

