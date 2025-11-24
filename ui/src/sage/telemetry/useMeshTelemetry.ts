import { useEffect, useState } from "react";

interface TelemetryPacket {
  node: string;
  cpu: number;
  memory: number;
  temp: number;
  latency: number;
  timestamp: number;
}

// TEMPORARY MOCK STREAM — replaced automatically when Pi WS is online
export function useMeshTelemetry() {
  const [data, setData] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    let interval: number;

    interval = window.setInterval(() => {
      const packet: TelemetryPacket = {
        node: "pi-01",
        cpu: Math.random() * 80 + 5,
        memory: Math.random() * 70 + 10,
        temp: Math.random() * 20 + 45,
        latency: Math.random() * 50 + 5,
        timestamp: Date.now(),
      };

      setData(prev => [...prev.slice(-49), packet]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return data;
}

