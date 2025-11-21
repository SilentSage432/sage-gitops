import { emitKernel } from "./KernelSignalBus";

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
  }, 1200); // 1.2 second cosmological beat
}

export function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = null;
}

