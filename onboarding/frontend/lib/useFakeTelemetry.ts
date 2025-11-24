import { useEffect, useState } from "react";

export function useFakeTelemetry() {
  const [data, setData] = useState({
    agentsOnline: 1,
    signal: 62,
    rotationETA: 47,
    status: "stabilizing",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        agentsOnline: Math.min(prev.agentsOnline + (Math.random() > 0.7 ? 1 : 0), 10),
        signal: 50 + Math.floor(Math.random() * 30),
        rotationETA: prev.rotationETA > 0 ? prev.rotationETA - 1 : 60,
        status: Math.random() > 0.92 ? "optimizing" : "stabilizing",
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return data;
}

