import { useEffect, useState } from "react";
import { subscribeToFederationAlerts, startMockFederationAlerts } from "./federation/alertBus";

export function useFederationAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Disabled - no mock alerts in development
    // startMockFederationAlerts();
    const unsub = subscribeToFederationAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => unsub();
  }, []);

  return alerts;
}

