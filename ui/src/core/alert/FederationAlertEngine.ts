// Simple EventEmitter-like class for browser environment
type EventCallback = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}

export type AlertSeverity = "info" | "warning" | "elevated" | "critical" | "fatal";

export interface FederationAlert {
  id: string;
  ts: number;
  source: string;        // e.g. "node:pi-1", "kernel", "rho2"
  message: string;
  severity: AlertSeverity;
}

class FederationAlertEngine extends SimpleEventEmitter {
  private history: FederationAlert[] = [];
  private escalationWindow = 60000; // 60 seconds

  emitAlert(alert: FederationAlert) {
    this.history.push(alert);
    // Keep only recent history (last 100 alerts)
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    this.detectEscalation(alert);
    this.emit("alert", alert);
  }

  private detectEscalation(alert: FederationAlert) {
    const recent = this.history.filter(
      a => Date.now() - a.ts < this.escalationWindow
    );

    const warningCount = recent.filter(a => a.severity === "warning").length;
    const elevatedCount = recent.filter(a => a.severity === "elevated").length;
    const criticalCount = recent.filter(a => a.severity === "critical").length;

    if (warningCount >= 3) {
      this.emit("escalation", { level: "elevated" });
    }

    if (elevatedCount >= 2) {
      this.emit("escalation", { level: "critical" });
    }

    if (criticalCount >= 2) {
      this.emit("escalation", { level: "fatal" });
    }

    if (alert.severity === "fatal") {
      this.emit("escalation", { level: "fatal" });
    }
  }
}

export const federationAlerts = new FederationAlertEngine();

