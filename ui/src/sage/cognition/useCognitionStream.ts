import { useEffect, useRef } from "react";
import { CognitionEvent } from "./eventTypes";
import { routeEvent, getPriority } from "./semanticRouter";

export function useCognitionStream() {
  const listeners = useRef<((e: CognitionEvent) => void)[]>([]);

  function onCognition(cb: (e: CognitionEvent) => void) {
    listeners.current.push(cb);

    return () => {
      listeners.current = listeners.current.filter((fn) => fn !== cb);
    };
  }

  // semantic routing layer dispatch
  function dispatch(event: CognitionEvent) {
    listeners.current.forEach((fn) => fn(event));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const event: CognitionEvent = {
        type: "system.warning",
        source: "ui.kernel",
        message: "simulated instability",
        timestamp: Date.now(),
      };

      // semantic priority ordering happens here
      console.log(
        `[SEMANTIC] priority=${getPriority(event)} type=${event.type}`
      );

      dispatch(event);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return { onCognition };
}
