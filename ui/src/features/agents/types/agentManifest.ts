/**
 * Agent Manifest Types
 * Type definitions for agent creation and genesis workflow
 */

export interface AgentManifest {
  name: string;
  class: string;
  capabilities: string[];
  version?: number;
  mode?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GenesisResult {
  genesisId: string;
  status: string;
  agentId?: string;
  message?: string;
}

export interface GenesisStatus {
  genesisId: string;
  status: "draft" | "validating" | "forging" | "deploying" | "completed" | "failed";
  progress?: number;
  message?: string;
  agentId?: string;
  error?: string;
}

export interface GenesisEvent {
  type: "agent.genesis.status" | "agent.genesis.progress" | "agent.genesis.completed" | "agent.genesis.failed";
  genesisId: string;
  status: string;
  progress?: number;
  message?: string;
  agentId?: string;
  error?: string;
  timestamp: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  class: string;
  capabilities: string[];
  status: "active" | "inactive" | "error" | "deploying";
  createdAt?: string;
  lastSeen?: string;
}

export type GenesisState = "draft" | "validating" | "forging" | "deploying" | "completed" | "failed";

