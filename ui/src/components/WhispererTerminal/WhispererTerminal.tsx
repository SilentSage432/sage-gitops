import React, { useEffect, useRef } from "react";

import { useTelemetryFilter } from "../../core/filters/useTelemetryFilter";
import { useWhispererStream } from "./useWhispererStream";
import "./whisperer.css";

export function WhispererTerminal() {
  const { messages } = useWhispererStream();
  const { activeFilter } = useTelemetryFilter();

  const containerRef = useRef<HTMLDivElement>(null);

  function messageMatchesFilter(msg: string): boolean {
    if (activeFilter === "ALL") return true;

    const map: Record<string, string> = {
      SYSTEM: "[SYSTEM]",
      ARC: "[ARC_EVENT]",
      RHO2: "[RHO2_EVENT]",
      FEDERATION: "[FEDERATION_EVENT]",
      AGENT: "[AGENT_EVENT]",
      WHISPERER: "[WHISPERER]",
      ERROR: "[ERROR]",
      DEBUG: "[DEBUG]",
      HEARTBEAT: "[HEARTBEAT_TICK]",
    };

    const tag = map[activeFilter];
    if (!tag) return true;

    return msg.includes(tag);
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto p-4 font-mono text-sm text-white"
    >
      {messages
        .filter(messageMatchesFilter)
        .map((msg, idx) => (
          <div key={idx} className="mb-1 whitespace-pre-wrap">
            {msg}
          </div>
        ))}
    </div>
  );
}
