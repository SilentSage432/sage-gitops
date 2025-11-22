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
      if (ws) {
        try {
          // WebSocket.CONNECTING = 0, WebSocket.OPEN = 1, WebSocket.CLOSING = 2, WebSocket.CLOSED = 3
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        } catch (error) {
          // Silently handle cleanup errors (e.g., WebSocket already closed)
        }
        ws = null;
      }
    };
  }, []);
}

