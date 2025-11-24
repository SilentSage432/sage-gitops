import { useEffect, useState } from "react";

interface TelemetryPacket {
  node: string;
  cpu: number;
  memory: number;
  temp: number;
  latency: number;
  timestamp: number;
}

// Auto-switches to real WebSocket when VITE_SAGE_WS_URL is set
export function useMeshTelemetry() {
  const [data, setData] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;
    let connectionAttempted = false;
    let mockStarted = false;

    // Generate mock packet
    const generateMockPacket = (): TelemetryPacket => ({
      node: "pi-01",
      cpu: Math.random() * 80 + 5,
      memory: Math.random() * 70 + 10,
      temp: Math.random() * 20 + 45,
      latency: Math.random() * 50 + 5,
      timestamp: Date.now(),
    });

    // Start mock stream
    const startMock = () => {
      if (mockStarted) return;
      mockStarted = true;
      setData([generateMockPacket()]);
      mockInterval = window.setInterval(() => {
        setData(prev => [...prev.slice(-49), generateMockPacket()]);
      }, 2000);
    };

    // ✅ Try real WebSocket when Pi cluster is online
    const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
    if (wsUrl && !connectionAttempted) {
      connectionAttempted = true;
      
      try {
        ws = new WebSocket(`${wsUrl}/mesh/telemetry`);

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
            const packet = JSON.parse(event.data);
            // Expected format: { node, cpu, memory, temp, latency, timestamp }
            setData(prev => [...prev.slice(-49), {
              node: packet.node || "",
              cpu: packet.cpu ?? 0,
              memory: packet.memory ?? 0,
              temp: packet.temp ?? 0,
              latency: packet.latency ?? 0,
              timestamp: packet.timestamp || Date.now(),
            }]);
            if (mockInterval) {
              clearInterval(mockInterval);
              mockInterval = null;
              mockStarted = false;
            }
          } catch (err) {
            console.error("Invalid telemetry WS payload:", err);
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

  return data;
}

