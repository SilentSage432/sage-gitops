import { emitKernel } from "./KernelSignalBus";
import { pushThought } from "../cognition/ThoughtChain";

let heartbeatInterval: NodeJS.Timeout | null = null;

export function startHeartbeat() {
  if (heartbeatInterval) return; // already running

  heartbeatInterval = setInterval(() => {
    const timestamp = Date.now();

    // Broadcast a universal heartbeat event
    emitKernel("kernel.heartbeat", { t: timestamp });

    // Secondary signals for subsystems
    emitKernel("kernel.pulse.ui", { t: timestamp });
    emitKernel("kernel.pulse.rho2", { t: timestamp });
    emitKernel("kernel.pulse.arc", { t: timestamp });

    pushThought({
      id: crypto.randomUUID(),
      from: "kernel",
      text: "Kernel tick",
      tags: ["heartbeat"],
      timestamp: Date.now()
    });
  }, 1200); // 1.2 second cosmological beat
}

export function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = null;
}

