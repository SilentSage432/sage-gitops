import { subscribeKernel } from "./KernelSignalBus";

type SignalHandler = (payload: any) => void;

interface RegistryEntry {
  signal: string;
  handler: SignalHandler;
  unsubscribe?: () => void;
}

class KernelSignalRegistry {
  private static _instance: KernelSignalRegistry;
  private registry: Map<string, RegistryEntry> = new Map();

  static get instance() {
    if (!this._instance) {
      this._instance = new KernelSignalRegistry();
    }
    return this._instance;
  }

  register(signal: string, handler: SignalHandler) {
    if (this.registry.has(signal)) return;

    const unsubscribe = subscribeKernel(signal, handler);

    this.registry.set(signal, { signal, handler, unsubscribe });
  }

  unregister(signal: string) {
    const entry = this.registry.get(signal);
    if (entry?.unsubscribe) entry.unsubscribe();
    this.registry.delete(signal);
  }

  clearAll() {
    this.registry.forEach(entry => entry.unsubscribe?.());
    this.registry.clear();
  }
}

export const KernelRegistry = KernelSignalRegistry.instance;

