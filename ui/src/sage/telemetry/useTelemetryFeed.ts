import { useEffect, useState } from "react";

import { classifyTelemetry } from "./TelemetryRouter";
import { TelemetryCategory, TelemetryEvent } from "./TelemetryTypes";

export function useTelemetryFeed(active: TelemetryCategory) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/stream");

    ws.onmessage = (msg) => {
      const raw = msg.data;
      const event = classifyTelemetry(raw);

      const shouldRoute = active === "ALL" ? true : event.category === active;

      if (shouldRoute) {
        setEvents((prev) => [...prev, event]);
      }
    };

    return () => ws.close();
  }, [active]);

  return events;
}

