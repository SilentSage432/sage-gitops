import React, { useEffect, useState } from "react";
import { useOperatorEffect } from "../../core/OperatorEffectContext";

export const WhispererTerminal: React.FC = () => {
  const [log, setLog] = useState<string[]>([]);
  const { dispatch } = useOperatorEffect();

  // WebSocket connection (local dev)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/stream");

    ws.onmessage = (ev) => {
      const message = ev.data;
      setLog((prev) => [...prev, message]);

      // Feed telemetry into HeartbeatEngine
      import("../../sage/core/HeartbeatEngine").then(mod => {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message;
          mod.updatePulseFromTelemetry(data);
        } catch {
          // If not JSON, try to extract metrics from string message
          const payload: any = {};
          if (message.includes("RHO2:EPOCH_ROTATION")) {
            payload.events = 1;
            payload.stress = 0.3;
          }
          if (message.includes("ARC:SIGMA:CRITICAL")) {
            payload.stress = 0.8;
            payload.load = 0.7;
          }
          if (Object.keys(payload).length > 0) {
            mod.updatePulseFromTelemetry(payload);
          }
        }
      });

      // --- Autonomous Agent Layer ---
      if (message.includes("RHO2:EPOCH_ROTATION")) {
        dispatch({ type: "FLASH_PURPLE" });
      }

      if (message.includes("ARC:SIGMA:CRITICAL")) {
        dispatch({ type: "NOTIFY", message: "Sigma reports instability." });
      }

      if (message.includes("WHISPER:FOCUS")) {
        dispatch({ type: "FOCUS_WHISPERER" });
      }
    };

    ws.onopen = () => {
      setLog((prev) => [...prev, "[connected → Arc Bridge]"]);
    };

    ws.onclose = () => {
      setLog((prev) => [...prev, "[disconnected]"]);
    };

    return () => ws.close();
  }, [dispatch]);

  return (
    <div className="p-4 overflow-y-auto font-mono text-sm text-slate-300">
      {log.map((line, idx) => (
        <div key={idx} className="mb-1">{line}</div>
      ))}
    </div>
  );
};
