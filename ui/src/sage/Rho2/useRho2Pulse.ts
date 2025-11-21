import { useEffect } from "react";
import { subscribeKernel } from "../kernel/KernelSignalBus";

export function useRho2Pulse(onPulse: (t: number) => void) {
  useEffect(() => {
    const unsub = subscribeKernel("kernel.pulse.rho2", (evt) => {
      onPulse(evt.t);
    });

    return unsub;
  }, [onPulse]);
}

