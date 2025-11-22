import { useEffect } from "react";
import { dispatchUIAction } from "../UIActionBus";

export function useAutonomicSafeguard(awareness: "CALM" | "ELEVATED" | "ALERT") {
  useEffect(() => {
    if (awareness === "ALERT") {
      dispatchUIAction("ui.safeguard.trigger", {
        action: "STABILIZE",
        reason: "awareness-alert",
        timestamp: Date.now(),
      });
    }
  }, [awareness]);
}

export default useAutonomicSafeguard;

