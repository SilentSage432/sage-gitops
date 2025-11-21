import { emitKernel } from "./KernelSignalBus";

export type ReflexEvent =
  | "rho2.epoch.rotate"
  | "agent.alert"
  | "node.warning"
  | "arc.state.shift"
  | "whisperer.intent"
  | "federation.join";

export const ReflexRules: Record<
  ReflexEvent,
  (payload: any) => void
> = {
  "rho2.epoch.rotate": (p) => {
    emitKernel("kernel.flash", { color: "purple", strength: "medium" });
    emitKernel("kernel.focus.arc", { arc: "rho2" });
  },

  "agent.alert": (p) => {
    emitKernel("kernel.flash", { color: "red", strength: "high" });
  },

  "node.warning": (p) => {
    emitKernel("kernel.flash", { color: "yellow", strength: "low" });
    emitKernel("kernel.intent.detected", { intent: "investigate node" });
  },

  "arc.state.shift": (p) => {
    emitKernel("kernel.flash", { color: "blue", strength: "low" });
  },

  "whisperer.intent": (p) => {
    emitKernel("kernel.flash", { color: "cyan", strength: "medium" });
  },

  "federation.join": (p) => {
    emitKernel("kernel.flash", { color: "green", strength: "medium" });
    emitKernel("kernel.focus.arc", { arc: "lambda" });
  },
};

