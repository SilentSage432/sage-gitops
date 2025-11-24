import { useEffect, useState } from "react";

export interface NodeFusionMetrics {
  cpu: number; // 0-100
  memory: number; // 0-100
  temp: number; // Celsius
  powerState: "normal" | "low" | "critical";
  powerWattage?: number;
  uptime: string;
  networkActivity: string;
  networkActive: boolean;
  heartbeatStability: "stable" | "unstable" | "critical";
  heartbeatQuality: number; // 0-5
  lastHeartbeat: string;
}

/**
 * Hook to fetch node fusion telemetry data.
 * Mock implementation - will be replaced with real WebSocket stream.
 */
export function useNodeFusionTelemetry(nodeId: string): NodeFusionMetrics | null {
  const [metrics, setMetrics] = useState<NodeFusionMetrics | null>(null);

  useEffect(() => {
    if (!nodeId) return;

    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;
    let connectionAttempted = false;
    let mockStarted = false;

    // Format uptime
    const formatUptime = (seconds: number): string => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    };

    // Generate mock metrics
    const generateMockMetrics = (): NodeFusionMetrics => {
      const cpu = Math.random() * 80 + 5;
      const memory = Math.random() * 70 + 10;
      const temp = Math.random() * 35 + 45;
      const powerW = 2.5 + Math.random() * 2.5;
      const powerState: "normal" | "low" | "critical" =
        powerW > 4 ? "normal" : powerW > 3 ? "low" : "critical";

      const uptimeSeconds = Math.floor(Math.random() * 86400 * 7); // Up to 7 days
      const networkActive = Math.random() > 0.3;
      const heartbeatQuality = Math.floor(Math.random() * 6); // 0-5

      return {
        cpu: Math.round(cpu * 10) / 10,
        memory: Math.round(memory * 10) / 10,
        temp: Math.round(temp * 10) / 10,
        powerState,
        powerWattage: Math.round(powerW * 100) / 100,
        uptime: formatUptime(uptimeSeconds),
        networkActivity: networkActive
          ? `${(Math.random() * 1000).toFixed(0)} Kbps`
          : "0 Kbps",
        networkActive,
        heartbeatStability:
          heartbeatQuality >= 4
            ? "stable"
            : heartbeatQuality >= 2
            ? "unstable"
            : "critical",
        heartbeatQuality,
        lastHeartbeat: `${Math.floor(Math.random() * 60)}s ago`,
      };
    };

    // Start mock stream
    const startMock = () => {
      if (mockStarted) return;
      mockStarted = true;
      setMetrics(generateMockMetrics());
      mockInterval = window.setInterval(() => {
        setMetrics(generateMockMetrics());
      }, 2000); // Update every 2 seconds
    };

    // ✅ Try real WebSocket when backend is online
    const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
    if (wsUrl && !connectionAttempted) {
      connectionAttempted = true;

      try {
        ws = new WebSocket(`${wsUrl}/nodes/${nodeId}/fusion`);

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
            // Expected format matches NodeFusionMetrics interface
            setMetrics(data);
            if (mockInterval) {
              clearInterval(mockInterval);
              mockInterval = null;
              mockStarted = false;
            }
          } catch (err) {
            console.error("Invalid fusion WS payload:", err);
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
  }, [nodeId]);

  return metrics;
}

