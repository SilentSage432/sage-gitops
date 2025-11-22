import { useEffect, useRef, useState } from "react";
import { dispatchUIAction } from "../UIActionBus";

type Level = "CALM" | "ELEVATED" | "ALERT";

export function useAwarenessMatrix() {
  const [level, setLevel] = useState<Level>("CALM");
  const scoreRef = useRef(0);

  const THRESHOLDS = {
    CALM: 0,
    ELEVATED: 5,
    ALERT: 12,
  };

  function updateLevel() {
    const score = scoreRef.current;

    let newLevel: Level;
    if (score >= THRESHOLDS.ALERT) newLevel = "ALERT";
    else if (score >= THRESHOLDS.ELEVATED) newLevel = "ELEVATED";
    else newLevel = "CALM";

    setLevel(newLevel);
    dispatchUIAction("ui.awareness.level", { level: newLevel });
  }

  useEffect(() => {
    function onEvent(e: CustomEvent) {
      const { type, priority } = e.detail;

      if (priority === "critical") scoreRef.current += 3;
      else if (priority === "warning") scoreRef.current += 1;
      else scoreRef.current -= 0.5;

      scoreRef.current = Math.max(0, Math.min(15, scoreRef.current));
      updateLevel();
    }

    window.addEventListener("SAGE_RUNTIME_EVENT", onEvent as EventListener);
    return () =>
      window.removeEventListener("SAGE_RUNTIME_EVENT", onEvent as EventListener);
  }, []);

  return level;
}

export default useAwarenessMatrix;

