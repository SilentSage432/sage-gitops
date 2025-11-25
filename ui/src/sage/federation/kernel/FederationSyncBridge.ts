/**
 * Federation Sync Bridge
 * Synchronizes agent creation and federation events
 */

import { federationKernelBus } from "./FederationKernelBus";
import { FederationAgentRegistry, type RegisteredAgent } from "./FederationAgentRegistry";

export const FederationSyncBridge = {
  /**
   * Start the sync bridge (initialize event listeners)
   */
  start(): void {
    // Echo new agents into federation logs
    federationKernelBus.onAny((event) => {
      federationKernelBus.emitEvent({
        type: "federation.log.append",
        entry: {
          ts: Date.now(),
          event,
        },
      });
    });
  },

  /**
   * Forge an agent through the federation bridge
   * Simulates the forging workflow with status updates
   */
  forgeAgent(manifest: any): RegisteredAgent {
    const entry = FederationAgentRegistry.register(manifest);

    // Simulate forge progress
    setTimeout(() => {
      FederationAgentRegistry.updateStatus(entry.id, "forging");
    }, 300);

    setTimeout(() => {
      FederationAgentRegistry.updateStatus(entry.id, "deploying");
    }, 1000);

    setTimeout(() => {
      FederationAgentRegistry.updateStatus(entry.id, "completed");

      federationKernelBus.emitEvent({
        type: "federation.agent.forged",
        agentId: entry.id,
        manifest,
      });
    }, 1800);

    return entry;
  },

  /**
   * Report an agent error
   */
  reportError(agentId: string, message: string): void {
    federationKernelBus.emitEvent({
      type: "federation.agent.error",
      agentId,
      message,
    });

    FederationAgentRegistry.updateStatus(agentId, "error");
  },
};

