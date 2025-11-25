import { useEffect, useState } from "react";

export function useFederationGenesisStream() {
  const [genesisEvent, setGenesisEvent] = useState<any>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    try {
      // Try to connect to WebSocket if URL is configured
      const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
      if (wsUrl) {
        ws = new WebSocket(`${wsUrl}/federation/genesis`);

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === "federation.node.genesis") {
              setGenesisEvent(data);
            }
          } catch (e) {
            console.warn("Invalid genesis message:", e);
          }
        };

        ws.onerror = () => {
          // Silently fail if WebSocket not available
          ws?.close();
          ws = null;
        };

        ws.onclose = () => {
          ws = null;
        };
      }
    } catch (err) {
      // Connection failed - no WebSocket available
      ws = null;
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return genesisEvent;
}

