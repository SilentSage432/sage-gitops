import { useEffect, useState } from "react";
import { TopologyNode } from "./FederationTopology";

/**
 * Hook to fetch topology node data for the federation health visualization.
 * Mock implementation - will be replaced with real WebSocket stream.
 */
export function useTopologyNodes() {
  const [nodes, setNodes] = useState<TopologyNode[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;
    let connectionAttempted = false;
    let mockStarted = false;

    // Generate mock topology nodes
    const generateMockNodes = (): TopologyNode[] => {
      // Start with 1-3 nodes (varying to test different layouts)
      const nodeCount = 1 + Math.floor(Math.random() * 3);
      const mockNodes: TopologyNode[] = [];

      for (let i = 1; i <= nodeCount; i++) {
        const rand = Math.random();
        const status: "healthy" | "elevated" | "critical" =
          rand > 0.7 ? "healthy" : rand > 0.3 ? "elevated" : "critical";

        mockNodes.push({
          id: `node-${i}`,
          name: `Node ${i}`,
          status,
          load: Math.random() * 100,
          health: status === "healthy" ? 70 + Math.random() * 30 : status === "elevated" ? 40 + Math.random() * 30 : Math.random() * 40,
        });
      }

      return mockNodes;
    };

    // Start mock stream
    const startMock = () => {
      if (mockStarted) return;
      mockStarted = true;
      setNodes(generateMockNodes());
      mockInterval = window.setInterval(() => {
        setNodes(generateMockNodes());
      }, 3000); // Update every 3 seconds
    };

    // ✅ Try real WebSocket when federation backend is online
    const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
    if (wsUrl && !connectionAttempted) {
      connectionAttempted = true;
      
      try {
        ws = new WebSocket(`${wsUrl}/federation/topology`);

        const connectionTimeout = window.setTimeout(() => {
          if (ws?.readyState === WebSocket.CONNECTING) {
            ws.close();
            ws = null;
            if (!mockStarted) startMock();
          }
        }, 2000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          if (mockInterval) {
            clearInterval(mockInterval);
            mockInterval = null;
            mockStarted = false;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Expected format: { nodes: [{ id, name, status, load, health }] }
            setNodes(data.nodes || []);
            if (mockInterval) {
              clearInterval(mockInterval);
              mockInterval = null;
              mockStarted = false;
            }
          } catch (err) {
            console.error("Invalid topology WS payload:", err);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
          if (ws) {
            ws.close();
            ws = null;
          }
          if (!mockStarted) startMock();
        };

        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          ws = null;
          if (!mockStarted) startMock();
        };
      } catch (err) {
        ws = null;
        startMock();
      }
    } else {
      // No WS URL - use mock immediately
      startMock();
    }

    return () => {
      if (mockInterval) clearInterval(mockInterval);
      if (ws) ws.close();
    };
  }, []);

  return nodes;
}

