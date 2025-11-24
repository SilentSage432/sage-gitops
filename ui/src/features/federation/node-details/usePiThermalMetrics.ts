import { useEffect, useState } from "react";
import { PiThermalMetrics } from "./PiThermalOverlay";

/**
 * Hook to fetch/generate Pi thermal metrics for a node.
 * Mock implementation - will be replaced with real WebSocket stream.
 */
export function usePiThermalMetrics(nodeId: string): PiThermalMetrics | null {
  const [metrics, setMetrics] = useState<PiThermalMetrics | null>(null);

  useEffect(() => {
    // Only generate metrics for Pi nodes
    if (!nodeId.startsWith("pi-")) {
      return;
    }

    // Generate initial metrics
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

    // Set initial metrics
    setMetrics(generateMetrics());

    // Update every 1-2 seconds (randomized to simulate real behavior)
    const interval = window.setInterval(() => {
      setMetrics(generateMetrics());
    }, 1000 + Math.random() * 1000); // 1-2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [nodeId]);

  return metrics;
}

