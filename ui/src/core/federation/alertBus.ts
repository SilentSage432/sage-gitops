// Mock Federation Alert Bus — Phase 2.7

type FederationAlert = {
  id: string;
  nodeId?: string;
  arc?: string;
  severity: "INFO" | "WARNING" | "ELEVATED" | "CRITICAL" | "FATAL";
  message: string;
  timestamp: number;
};

const listeners = new Set<(alert: FederationAlert) => void>();
let mockIntervalId: number | null = null;

export function subscribeToFederationAlerts(cb: (alert: FederationAlert) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// MOCK STREAM — replace with real WebSocket later
export function startMockFederationAlerts() {
  // Prevent multiple intervals
  if (mockIntervalId !== null) {
    return;
  }

  mockIntervalId = window.setInterval(() => {
    const severities = ["INFO", "WARNING", "ELEVATED", "CRITICAL"] as const;
    const alert: FederationAlert = {
      id: crypto.randomUUID(),
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: "Mock federation signal detected",
      timestamp: Date.now(),
      nodeId: `node-${Math.ceil(Math.random() * 3)}`,
      arc: ["rho2", "theta", "sigma", "omega"][Math.floor(Math.random() * 4)]
    };

    listeners.forEach((cb) => cb(alert));
    window.dispatchEvent(
      new CustomEvent("SAGE_ALERT", { detail: alert })
    );
  }, 15000);
}

