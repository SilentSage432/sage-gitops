import { useEffect, useState } from "react";

export interface NodeEvent {
  id: string;
  type: "info" | "warning" | "critical";
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Mock WebSocket stream - will be replaced with real Pi cluster event feed
export function useNodeEvents(nodeId: string) {
  const [events, setEvents] = useState<NodeEvent[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;

    try {
      // ✅ Real WebSocket when Pi cluster is online
      if (import.meta.env.VITE_SAGE_WS_URL) {
        ws = new WebSocket(`${import.meta.env.VITE_SAGE_WS_URL}/nodes/${nodeId}/events`);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEvent: NodeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              type: data.type || "info",
              message: data.message || "Event received",
              timestamp: data.timestamp || Date.now(),
              metadata: data.metadata,
            };
            setEvents((prev) => {
              const updated = [...prev, newEvent];
              // Cap at 200 events (FIFO)
              return updated.slice(-200);
            });
          } catch (err) {
            console.error("Invalid event WS payload:", err);
          }
        };

        ws.onerror = () => {
          console.warn("Node events WS failed — using mock");
          ws?.close();
          ws = null;
        };
      }
    } catch {
      ws = null;
    }

    // ✅ Mock stream (works now)
    if (!ws || !import.meta.env.VITE_SAGE_WS_URL) {
      const eventMessages = [
        { type: "info" as const, message: "Heartbeat received" },
        { type: "info" as const, message: "CPU load normal" },
        { type: "warning" as const, message: "Memory usage above 70%" },
        { type: "info" as const, message: "Network sync complete" },
        { type: "critical" as const, message: "High temperature detected" },
        { type: "info" as const, message: "System check passed" },
        { type: "warning" as const, message: "Disk space below 20%" },
      ];

      let messageIndex = 0;
      const generateMockEvent = () => {
        const msg = eventMessages[messageIndex % eventMessages.length];
        messageIndex++;

        const newEvent: NodeEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: msg.type,
          message: msg.message,
          timestamp: Date.now(),
          metadata: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            temp: Math.random() * 80 + 40,
          },
        };

        setEvents((prev) => {
          const updated = [...prev, newEvent];
          // Cap at 200 events (FIFO)
          return updated.slice(-200);
        });
      };

      // Initial event
      generateMockEvent();
      // Generate events every 3-7 seconds
      mockInterval = window.setInterval(
        generateMockEvent,
        3000 + Math.random() * 4000
      );
    }

    return () => {
      if (mockInterval) clearInterval(mockInterval);
      ws?.close();
    };
  }, [nodeId]);

  return events;
}

