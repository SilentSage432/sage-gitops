import { useEffect } from "react";
import { predictiveCore } from "../core/PredictiveCore";

export function usePredictiveWS() {
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket("ws://localhost:7070/predictive");

      ws.onopen = () => console.log("🔮 Predictive WS connected");
      ws.onclose = () => console.log("🔮 Predictive WS disconnected");
      ws.onerror = () => {
        // Silently handle connection errors when backend isn't available
      };

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
    } catch (error) {
      // Handle WebSocket creation errors gracefully
    }

    return () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    };
  }, []);
}

