import { useEffect } from "react";
import { subscribeKernel } from "./KernelSignalBus";
import { ReflexRules } from "./ReflexRules";

export function useReflex() {
  useEffect(() => {
    const unsub = subscribeKernel("kernel.reflex", (evt) => {
      const { type, payload } = evt;

      const handler = ReflexRules[type];
      if (handler) handler(payload);
    });

    return unsub;
  }, []);
}

