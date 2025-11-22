import { useEffect } from "react";
import { dispatchUIAction } from "./UIActionBus";

const RECENT_WINDOW_MS = 4000;

let lastCommandTime = 0;
let lastArcFocus = "";

export function useOperatorCortex(selectedItem?: string) {
  useEffect(() => {
    // detect arc focus changes
    if (selectedItem && selectedItem !== lastArcFocus) {
      lastArcFocus = selectedItem;

      dispatchUIAction("cortex.context-shift", {
        arc: selectedItem,
        timestamp: Date.now(),
      });
    }
  }, [selectedItem]);

  // global operator command hook
  function registerCommand() {
    lastCommandTime = Date.now();

    dispatchUIAction("cortex.operator-engaged", {
      recent: true,
      ts: Date.now(),
    });
  }

  function isOperatorActive() {
    return Date.now() - lastCommandTime < RECENT_WINDOW_MS;
  }

  return {
    registerCommand,
    isOperatorActive,
  };
}

export default useOperatorCortex;

