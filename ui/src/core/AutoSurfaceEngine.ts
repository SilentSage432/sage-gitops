import { useEffect, useRef } from "react";
import { dispatchUIAction } from "./UIActionBus";

const PRIORITY: Record<string, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function useAutoSurface(isOperatorActive: () => boolean) {
  const lastSurface = useRef(0);
  const COOLDOWN_MS = 5000;

  useEffect(() => {
    function onEvent(e: CustomEvent) {
      const { type, payload, priority = "info" } = e.detail;

      // ignore if operator is busy
      if (isOperatorActive()) return;

      const now = Date.now();
      if (now - lastSurface.current < COOLDOWN_MS) return;

      const priorityValue = PRIORITY[priority] || PRIORITY.info;
      if (priorityValue >= PRIORITY.warning) {
        lastSurface.current = now;

        dispatchUIAction("ui.surface.panel", {
          panel: type,
          meta: payload,
          ts: now,
        });
      }
    }

    window.addEventListener("SAGE_RUNTIME_EVENT", onEvent as EventListener);
    return () =>
      window.removeEventListener("SAGE_RUNTIME_EVENT", onEvent as EventListener);
  }, [isOperatorActive]);
}

export default useAutoSurface;

