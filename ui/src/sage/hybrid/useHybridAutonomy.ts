import { useEffect } from "react";
import { useHybrid } from "./HybridModeContext";
import { AutonomyRules } from "./autonomyRules";

export function useHybridAutonomy() {
  const { requestUIAction } = useHybrid();

  useEffect(() => {
    function onFedEvent(e: CustomEvent) {
      const { type, data } = e.detail;

      // Example: Sigma load spike
      if (type === "sigma.loadSpike") {
        if (AutonomyRules.validate("ui.focus.arc")) {
          requestUIAction("ui.focus.arc", { arc: "sigma" });
        }
      }

      // Example: Rho² epoch rotation
      if (type === "rho2.epochRotation") {
        if (AutonomyRules.validate("ui.focus.rho2")) {
          requestUIAction("ui.focus.rho2");
        }
      }
    }

    window.addEventListener("FED_EVENT", onFedEvent as EventListener);
    return () =>
      window.removeEventListener("FED_EVENT", onFedEvent as EventListener);
  }, [requestUIAction]);
}

