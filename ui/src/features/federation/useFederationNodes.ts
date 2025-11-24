import { useEffect, useState } from "react";

export interface FederationNodeStatus {
  id: string;
  status: "online" | "degraded" | "offline";
  role?: string;
  lastSeen?: number;
}

// Mock WebSocket stream - will be replaced with real Pi cluster connection
export function useFederationNodes() {
  const [nodes, setNodes] = useState<FederationNodeStatus[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;
    let connectionAttempted = false;
    let mockStarted = false;

    // Generate mock nodes function
    const generateMockNodes = () => {
      const rand = Math.random();
      const status = rand > 0.7 ? "online" : rand > 0.3 ? "degraded" : "offline";
      
      const mockNodes: FederationNodeStatus[] = [
        {
          id: "pi-01",
          status,
          role: "worker",
          lastSeen: Date.now(),
        },
      ];
      setNodes(mockNodes);
    };

    // Start mock stream
    const startMock = () => {
      if (mockStarted) return;
      mockStarted = true;
      generateMockNodes();
      mockInterval = window.setInterval(generateMockNodes, 3000);
    };

    // ✅ Try real WebSocket when Pi cluster is online
    const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
    if (wsUrl && !connectionAttempted) {
      connectionAttempted = true;
      
      try {
        ws = new WebSocket(`${wsUrl}/federation/nodes`);

        // Set a timeout to fallback to mock if connection doesn't establish quickly
        const connectionTimeout = window.setTimeout(() => {
          if (ws?.readyState === WebSocket.CONNECTING) {
            ws.close();
            ws = null;
            if (!mockStarted) {
              startMock();
            }
          }
        }, 2000); // 2 second timeout

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          // Connection successful - stop mock if it was started
          if (mockInterval) {
            clearInterval(mockInterval);
            mockInterval = null;
            mockStarted = false;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setNodes(data.nodes || []);
            // Stop mock if real data is coming in
            if (mockInterval) {
              clearInterval(mockInterval);
              mockInterval = null;
              mockStarted = false;
            }
          } catch (err) {
            console.error("Invalid WS payload:", err);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
          // Silently fallback to mock (errors are expected when server isn't running)
          if (ws) {
            ws.close();
            ws = null;
          }
          if (!mockStarted) {
            startMock();
          }
        };

        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          ws = null;
          // Only start mock if we haven't already
          if (!mockStarted) {
            startMock();
          }
        };
      } catch (err) {
        // Connection creation failed - use mock
        ws = null;
        startMock();
      }
    } else {
      // No WS URL configured - use mock immediately
      startMock();
    }

    return () => {
      if (mockInterval) clearInterval(mockInterval);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return nodes;
}

