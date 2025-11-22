import { useEffect, useRef } from "react";
import { CognitionEvent } from "./eventTypes";

export function useCognitionStream() {
  const listeners = useRef<((e: CognitionEvent) => void)[]>([]);

  function onCognition(cb: (e: CognitionEvent) => void) {
    listeners.current.push(cb);

    return () => {
      listeners.current = listeners.current.filter((fn) => fn !== cb);
    };
  }

  // simulate incoming cognition events
  useEffect(() => {
    const interval = setInterval(() => {
      const event: CognitionEvent = {
        type: "system.warning",
        source: "ui.kernel",
        message: "simulated instability",
        timestamp: Date.now(),
      };

      listeners.current.forEach((fn) => fn(event));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return { onCognition };
}
