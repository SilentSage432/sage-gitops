import { useCallback, useEffect } from "react";

export interface CognitionEvent {
  type: string;
  [key: string]: any;
}

export function useCognitionStream() {
  const onCognition = useCallback((handler: (event: CognitionEvent) => void) => {
    function eventHandler(e: CustomEvent) {
      handler(e.detail as CognitionEvent);
    }

    window.addEventListener("SAGE_THOUGHT", eventHandler as EventListener);
    window.addEventListener("SAGE_RUNTIME_EVENT", eventHandler as EventListener);
    window.addEventListener("SAGE_ALERT", eventHandler as EventListener);

    return () => {
      window.removeEventListener("SAGE_THOUGHT", eventHandler as EventListener);
      window.removeEventListener("SAGE_RUNTIME_EVENT", eventHandler as EventListener);
      window.removeEventListener("SAGE_ALERT", eventHandler as EventListener);
    };
  }, []);

  return { onCognition };
}

