import { useEffect, useRef } from "react";
import { dispatchUIAction } from "../UIActionBus";

export function useSelfHealingLoop(errorSignal: boolean) {
  const failureCount = useRef(0);
  const inRecovery = useRef(false);

  useEffect(() => {
    if (!errorSignal) {
      failureCount.current = 0;
      return;
    }

    failureCount.current++;

    // Trigger recovery only on sustained failure
    if (failureCount.current >= 3 && !inRecovery.current) {
      inRecovery.current = true;

      dispatchUIAction("ui.recovery.start", {
        level: "SOFT",
        reason: "repeated-failure",
        timestamp: Date.now(),
      });

      setTimeout(() => {
        inRecovery.current = false;

        dispatchUIAction("ui.recovery.complete", {
          restored: true,
          timestamp: Date.now(),
        });
      }, 4000);
    }
  }, [errorSignal]);
}

export default useSelfHealingLoop;

