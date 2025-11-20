import { useEffect, useState } from "react";
import { getPulse, onPulseUpdate, PulseMetrics } from "../core/HeartbeatEngine";

export function useHeartbeat(): PulseMetrics {
  const [pulse, setPulse] = useState<PulseMetrics>(getPulse());

  useEffect(() => {
    return onPulseUpdate((m) => setPulse(m));
  }, []);

  return pulse;
}

