import { useEffect, useRef } from "react";
import { CognitionEvent } from "./eventTypes";
import { routeEvent, getPriority } from "./semanticRouter";
import { escalateEvent } from "./escalationEngine";

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
    // autonomous escalation routing
    escalateEvent(event, {
      operatorNotify: (msg) =>
        window.dispatchEvent(
          new CustomEvent("SAGE_OPERATOR_ALERT", { detail: { msg } })
        ),

      systemFlag: (e) =>
        window.dispatchEvent(
          new CustomEvent("SAGE_SYSTEM_EVENT", { detail: { event: e } })
        ),
    });

    // continue normal listener chain
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
