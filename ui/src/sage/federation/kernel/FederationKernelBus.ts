/**
 * Federation Kernel Bus
 * Event bus for federation-wide agent and system events
 */

export type FederationEvent =
  | { type: "federation.agent.created"; agentId: string; manifest: any }
  | { type: "federation.agent.forged"; agentId: string; manifest: any }
  | { type: "federation.agent.status"; agentId: string; status: string }
  | { type: "federation.agent.error"; agentId: string; message: string }
  | { type: "federation.log.append"; entry: any };

type EventHandler = (event: FederationEvent) => void;

/**
 * Simple EventEmitter-like class for browser compatibility
 */
class FederationKernelBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  emitEvent(event: FederationEvent): void {
    // Emit to specific type listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[FederationKernelBus] Error in handler for ${event.type}:`, err);
        }
      });
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.listeners.get("any");
    if (wildcardListeners) {
      wildcardListeners.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[FederationKernelBus] Error in wildcard handler:`, err);
        }
      });
    }
  }

  onEvent(type: FederationEvent["type"], handler: EventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(handler);
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  onAny(handler: EventHandler): () => void {
    if (!this.listeners.has("any")) {
      this.listeners.set("any", new Set());
    }
    this.listeners.get("any")!.add(handler);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get("any");
      if (listeners) {
        listeners.delete(handler);
        if (listeners.size === 0) {
          this.listeners.delete("any");
        }
      }
    };
  }

  removeListener(type: FederationEvent["type"], handler: EventHandler): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(handler);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  removeAllListeners(type?: FederationEvent["type"]): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}

export const federationKernelBus = new FederationKernelBus();

