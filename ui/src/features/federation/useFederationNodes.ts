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

    try {
      // ✅ Real WebSocket when Pi cluster is online
      if (import.meta.env.VITE_SAGE_WS_URL) {
        ws = new WebSocket(`${import.meta.env.VITE_SAGE_WS_URL}/federation/nodes`);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setNodes(data.nodes || []);
          } catch (err) {
            console.error("Invalid WS payload:", err);
          }
        };

        ws.onerror = () => {
          console.warn("Federation nodes WS failed — using mock");
          ws?.close();
          ws = null;
        };
      }
    } catch {
      ws = null;
    }

    // ✅ Mock stream (works now)
    if (!ws || !import.meta.env.VITE_SAGE_WS_URL) {
      // Generate mock node with varying status
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

      generateMockNodes();
      mockInterval = window.setInterval(generateMockNodes, 3000);
    }

    return () => {
      if (mockInterval) clearInterval(mockInterval);
      ws?.close();
    };
  }, []);

  return nodes;
}

