import { emitKernel } from "./KernelSignalBus";

let ticker: any = null;

export function startKernelPulse() {
  if (ticker) return;

  ticker = setInterval(() => {
    emitKernel("kernel.pulse", { ts: Date.now() });
  }, 1800); 
}

export function stopKernelPulse() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

