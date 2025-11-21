import { useEffect, useState } from "react";
import { subscribeKernel } from "./KernelSignalBus";

export function useKernelSignal(eventName: string) {
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    const unsub = subscribeKernel(eventName, (data) => {
      setPayload({
        ts: Date.now(),
        data,
      });
    });

    return unsub;
  }, [eventName]);

  return payload;
}

