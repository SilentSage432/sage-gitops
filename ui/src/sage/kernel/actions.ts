import { emitKernel } from "./KernelSignalBus";

export const KernelActions = {
  pulse() {
    emitKernel("kernel.pulse");
  },

  warning(arc: string) {
    emitKernel("kernel.warning", { arc });
  },

  focusArc(arc: string) {
    emitKernel("kernel.focus.arc", { arc });
  },

  intentDetected(intent: string) {
    emitKernel("kernel.intent.detected", { intent });
  },

  reflex(type: string, payload?: any) {
    emitKernel("kernel.reflex", { type, payload });
  },
};

