/**
 * Genesis Orchestrator
 * Main orchestrator for agent genesis workflow
 */

import { AgentManifest, GenesisResult, GenesisStatus, GenesisEvent } from "../types/agentManifest";
import { validateManifest } from "./agentManifestValidator";
import { ValidationResult } from "../types/agentManifest";
import { next as stateMachineNext, getStateLabel } from "./genesisStateMachine";
import { createAgent, getGenesisStatus } from "../../../services/agentService";
import { genesisClient } from "../../../api/genesisClient";

type GenesisEventHandler = (event: { type: string; data: any }) => void;

class GenesisOrchestrator {
  private eventHandlers: Map<string, Set<GenesisEventHandler>> = new Map();
  private currentStates: Map<string, GenesisStatus["status"]> = new Map();

  /**
   * Emit an event to all subscribers
   */
  private emit(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler({ type: eventType, data });
        } catch (err) {
          console.error(`[GenesisOrchestrator] Error in ${eventType} handler:`, err);
        }
      });
    }
  }

  /**
   * Validate a manifest
   */
  async validateManifest(manifest: AgentManifest): Promise<ValidationResult> {
    return validateManifest(manifest);
  }

  /**
   * Forge an agent (main orchestration function)
   */
  async forgeAgent(manifest: AgentManifest): Promise<GenesisResult> {
    // Step 1: Validate manifest
    const validation = await this.validateManifest(manifest);
    if (!validation.valid) {
      this.emit("genesis.failed", {
        manifest,
        errors: validation.errors,
      });
      throw new Error(`Manifest validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 2: Submit genesis request
    this.emit("genesis.started", { manifest });

    let genesisResult: GenesisResult;
    try {
      genesisResult = await createAgent(manifest);
      this.currentStates.set(genesisResult.genesisId, "validating");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.emit("genesis.failed", {
        manifest,
        error: errorMessage,
      });
      throw error;
    }

    // Step 3: Subscribe to status updates and track progress
    this.trackGenesisStatus(genesisResult.genesisId, manifest);

    return genesisResult;
  }

  /**
   * Orchestrate the complete genesis workflow
   */
  async orchestrate(manifest: AgentManifest): Promise<GenesisResult> {
    return this.forgeAgent(manifest);
  }

  /**
   * Track genesis status updates
   */
  private trackGenesisStatus(genesisId: string, manifest: AgentManifest): void {
    let currentState: GenesisStatus["status"] = this.currentStates.get(genesisId) || "validating";

    // Subscribe to WebSocket events
    const unsubscribe = genesisClient.subscribeToGenesisEvents((event: GenesisEvent) => {
      if (event.genesisId !== genesisId) {
        return;
      }

      // Update state via state machine
      const nextState = stateMachineNext(currentState, event);
      if (nextState !== currentState) {
        currentState = nextState;
        this.currentStates.set(genesisId, currentState);

        // Emit progress event
        this.emit("genesis.progress", {
          genesisId,
          status: currentState,
          stateLabel: getStateLabel(currentState),
          progress: event.progress,
          message: event.message,
        });
      }

      // Handle terminal states
      if (event.type === "agent.genesis.completed" || currentState === "completed") {
        this.emit("genesis.completed", {
          genesisId,
          agentId: event.agentId,
          manifest,
        });
        unsubscribe();
        this.currentStates.delete(genesisId);
      } else if (event.type === "agent.genesis.failed" || currentState === "failed") {
        this.emit("genesis.failed", {
          genesisId,
          error: event.error || event.message,
          manifest,
        });
        unsubscribe();
        this.currentStates.delete(genesisId);
      }
    });

    // Also poll for status updates (fallback if WebSocket fails)
    const pollInterval = setInterval(async () => {
      try {
        const status = await getGenesisStatus(genesisId);
        const nextState = stateMachineNext(currentState, {
          type: "agent.genesis.status",
          genesisId,
          status: status.status,
          progress: status.progress,
          message: status.message,
          agentId: status.agentId,
          timestamp: Date.now(),
        } as GenesisEvent);

        if (nextState !== currentState) {
          currentState = nextState;
          this.currentStates.set(genesisId, currentState);

          this.emit("genesis.progress", {
            genesisId,
            status: currentState,
            stateLabel: getStateLabel(currentState),
            progress: status.progress,
            message: status.message,
          });
        }

        // Stop polling on terminal states
        if (currentState === "completed" || currentState === "failed") {
          clearInterval(pollInterval);
          unsubscribe();
          this.currentStates.delete(genesisId);

          if (currentState === "completed") {
            this.emit("genesis.completed", {
              genesisId,
              agentId: status.agentId,
              manifest,
            });
          } else {
            this.emit("genesis.failed", {
              genesisId,
              error: status.error || status.message,
              manifest,
            });
          }
        }
      } catch (error) {
        console.error(`[GenesisOrchestrator] Error polling status for ${genesisId}:`, error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup polling after 5 minutes (should be done by then)
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  }

  /**
   * Subscribe to genesis events
   */
  on(eventType: "genesis.started" | "genesis.progress" | "genesis.completed" | "genesis.failed", handler: GenesisEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
}

// Export singleton instance
export const genesisOrchestrator = new GenesisOrchestrator();

