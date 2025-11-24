import { useEffect, useState } from "react";
import { PiThermalMetrics } from "./PiThermalOverlay";

/**
 * Hook to fetch Pi thermal metrics for a node.
 * Auto-switches to real WebSocket when VITE_SAGE_WS_URL is set.
 */
export function usePiThermalMetrics(nodeId: string): PiThermalMetrics | null {
  const [metrics, setMetrics] = useState<PiThermalMetrics | null>(null);

  useEffect(() => {
    // Only generate metrics for Pi nodes
    if (!nodeId.startsWith("pi-")) {
      return;
    }

    let ws: WebSocket | null = null;
    let mockInterval: number | null = null;
    let connectionAttempted = false;
    let mockStarted = false;

    // Generate mock metrics function
    const generateMetrics = (): PiThermalMetrics => {
      const baseTemp = 45 + Math.random() * 40; // 45-85°C
      const tempC = Math.max(40, Math.min(90, baseTemp));
      
      // Higher temperature increases power and may cause throttling
      const tempFactor = (tempC - 40) / 50; // 0-1 scale
      const powerW = 2.5 + tempFactor * 2.5; // 2.5-5W
      
      // Clock frequency decreases when throttled or hot
      const isThrottled = tempC > 75 || Math.random() < 0.1;
      const clockMHz = isThrottled 
        ? 800 + Math.random() * 400 // 800-1200MHz when throttled
        : 1200 + Math.random() * 400; // 1200-1600MHz normal
      
      // Voltage slightly decreases when hot/throttled
      const voltage = isThrottled 
        ? 4.5 + Math.random() * 0.3 // 4.5-4.8V when throttled
        : 4.8 + Math.random() * 0.4; // 4.8-5.2V normal

      return {
        tempC: Math.round(tempC * 10) / 10,
        powerW: Math.round(powerW * 10) / 10,
        clockMHz: Math.round(clockMHz),
        voltage: Math.round(voltage * 100) / 100,
        throttled: isThrottled,
      };
    };

    // Start mock stream
    const startMock = () => {
      if (mockStarted) return;
      mockStarted = true;
      setMetrics(generateMetrics());
      mockInterval = window.setInterval(() => {
        setMetrics(generateMetrics());
      }, 1000 + Math.random() * 1000); // 1-2 seconds
    };

    // ✅ Try real WebSocket when Pi cluster is online
    const wsUrl = import.meta.env.VITE_SAGE_WS_URL;
    if (wsUrl && !connectionAttempted) {
      connectionAttempted = true;
      
      try {
        ws = new WebSocket(`${wsUrl}/nodes/${nodeId}/thermal`);

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
            // Expected format: { tempC, powerW, clockMHz, voltage, throttled }
            setMetrics({
              tempC: data.tempC ?? 0,
              powerW: data.powerW ?? 0,
              clockMHz: data.clockMHz ?? 0,
              voltage: data.voltage ?? 0,
              throttled: data.throttled ?? false,
            });
            if (mockInterval) {
              clearInterval(mockInterval);
              mockInterval = null;
              mockStarted = false;
            }
          } catch (err) {
            console.error("Invalid thermal WS payload:", err);
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

