import { useEffect } from "react";
import { useUIShockwave } from "./UIShockwaveContext";

export function useUIAlertsBridge() {
  const { triggerWarning, triggerCritical } = useUIShockwave();

  useEffect(() => {
    function onAlert(e: CustomEvent) {
      const { type } = e.detail;

      if (type === "WARNING") triggerWarning();
      if (type === "CRITICAL") triggerCritical();
    }

    window.addEventListener("SAGE_UI_ALERT", onAlert as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ALERT", onAlert as EventListener);
  }, []);
}

