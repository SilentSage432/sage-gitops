import { useEffect, useRef } from "react";
import { useCognitionStream } from "./useCognitionStream";

const WINDOW_MS = 15000;        // 15-second rolling window
const ALERT_THRESHOLD = 4;      // 4 repeating signals triggers awareness

export function useStabilityForecast() {
  const { onCognition } = useCognitionStream();
  const recent = useRef<number[]>([]);

  useEffect(() => {
    return onCognition((event) => {
      if (event.type !== "system.error" && event.type !== "system.warning") return;

      const now = Date.now();
      recent.current.push(now);

      // prune old entries
      recent.current = recent.current.filter(
        (t) => now - t < WINDOW_MS
      );

      // if threshold crossed → emit advisory signal
      if (recent.current.length >= ALERT_THRESHOLD) {
        window.dispatchEvent(
          new CustomEvent("SAGE_FORECAST", {
            detail: { level: "warning", pattern: "repeating-instability" }
          })
        );
      }
    });
  }, [onCognition]);
}

