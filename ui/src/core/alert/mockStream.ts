import { federationAlerts } from "./FederationAlertEngine";

export function startMockAlerts() {
  setInterval(() => {
    const sev = ["info", "warning", "warning", "elevated"][Math.floor(Math.random()*4)] as "info" | "warning" | "elevated";
    federationAlerts.emitAlert({
      id: crypto.randomUUID(),
      ts: Date.now(),
      source: ["kernel", "rho2", "node:pi-1"][Math.floor(Math.random()*3)],
      message: `Simulated ${sev} event`,
      severity: sev,
    });
  }, 8000);
}

