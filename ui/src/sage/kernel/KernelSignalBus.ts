import { EventEmitter } from "events";

class KernelSignalBus extends EventEmitter {}

export const kernelBus = new KernelSignalBus();

export function emitKernel(event: string, payload?: any) {
  kernelBus.emit(event, payload);
}

export function subscribeKernel(event: string, handler: (payload: any) => void) {
  kernelBus.on(event, handler);
  return () => kernelBus.off(event, handler);
}

