import { useEffect, useState } from "react";

export function useWhispererStream() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket("ws://localhost:7070/stream");

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const text =
            typeof parsed === "string" ? parsed : JSON.stringify(parsed);
          setMessages((prev) => [...prev, text]);
        } catch {
          const text =
            typeof event.data === "string"
              ? event.data
              : JSON.stringify(event.data);
          setMessages((prev) => [...prev, text]);
        }
      };

      ws.onerror = () => {
        // Silently handle connection errors when backend isn't available
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

  return { messages };
}

