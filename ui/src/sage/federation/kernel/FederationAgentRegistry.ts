/**
 * Federation Agent Registry
 * Central registry for tracking all agents in the federation
 */

import { federationKernelBus } from "./FederationKernelBus";

export interface RegisteredAgent {
  id: string;
  manifest: any;
  status: string;
  createdAt: number;
}

const registry: Map<string, RegisteredAgent> = new Map();

export const FederationAgentRegistry = {
  register(manifest: any): RegisteredAgent {
    const id = `agent_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const entry: RegisteredAgent = {
      id,
      manifest,
      status: "created",
      createdAt: Date.now(),
    };

    registry.set(id, entry);

    federationKernelBus.emitEvent({
      type: "federation.agent.created",
      agentId: id,
      manifest,
    });

    return entry;
  },

  updateStatus(id: string, status: string): void {
    const entry = registry.get(id);
    if (!entry) return;

    entry.status = status;

    federationKernelBus.emitEvent({
      type: "federation.agent.status",
      agentId: id,
      status,
    });
  },

  list(): RegisteredAgent[] {
    return Array.from(registry.values());
  },

  get(id: string): RegisteredAgent | undefined {
    return registry.get(id);
  },

  /**
   * Remove an agent from the registry (cleanup)
   */
  remove(id: string): boolean {
    return registry.delete(id);
  },

  /**
   * Get count of registered agents
   */
  count(): number {
    return registry.size;
  },

  /**
   * Clear all agents (for testing/reset)
   */
  clear(): void {
    registry.clear();
  },
};

