import { useEffect } from "react";
import { useKernel } from "../UIKernelSync";

export function useKernelHeartbeat() {
  const updatePulse = useKernel((s) => s.updatePulse);
  const updateShard = useKernel((s) => s.updateShard);

  useEffect(() => {
    let t = 0;

    const interval = setInterval(() => {
      t += 1;
      updatePulse(Math.sin(t / 4));
      updateShard((t % 360));
    }, 1000);

    return () => clearInterval(interval);
  }, [updatePulse, updateShard]);
}

