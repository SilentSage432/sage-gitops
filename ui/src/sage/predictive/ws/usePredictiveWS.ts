import { useEffect } from "react";
import { predictiveCore } from "../core/PredictiveCore";

export function usePredictiveWS() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/predictive");

    ws.onopen = () => console.log("🔮 Predictive WS connected");
    ws.onclose = () => console.log("🔮 Predictive WS disconnected");

    ws.onmessage = (msg) => {
      try {
        const evt = JSON.parse(msg.data);
        const signal = predictiveCore.processEvent(evt);

        window.dispatchEvent(
          new CustomEvent("SAGE_PREDICTIVE_SIGNAL", {
            detail: signal,
          })
        );
      } catch (_) {}
    };

    return () => ws.close();
  }, []);
}

