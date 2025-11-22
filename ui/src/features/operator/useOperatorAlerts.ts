import { useState, useEffect } from "react";

export function useOperatorAlerts() {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    function onAlert(e: CustomEvent) {
      setAlerts((prev) => [...prev, e.detail.msg]);
    }

    window.addEventListener("SAGE_OPERATOR_ALERT", onAlert as EventListener);
    return () =>
      window.removeEventListener("SAGE_OPERATOR_ALERT", onAlert as EventListener);
  }, []);

  return { alerts };
}

