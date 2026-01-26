/**
 * Agent Library Registry
 * The Canonical Agent Library — SAGE's growing genetic archive
 */

export interface AgentLibraryItem {
  id: string;
  name: string;
  class: string;
  description: string;
  capabilities: string[];
}

// 🔮 The Canonical Agent Library — SAGE's growing genetic archive
export const AGENT_LIBRARY: AgentLibraryItem[] = [
  {
    id: "sage.researcher.alpha",
    name: "Alpha Researcher",
    class: "researcher",
    description: "Foundational research agent for data extraction, analysis, and context synthesis.",
    capabilities: ["data-analysis", "pattern-detection", "context-reasoning"],
  },
  {
    id: "sage.sentinel.delta",
    name: "Delta Sentinel",
    class: "sentinel",
    description: "Surveillance-grade sentinel for security, anomaly detection, and boundary watching.",
    capabilities: ["surveillance", "boundary-watch", "anomaly-detection"],
  },
  {
    id: "sage.auditor.gamma",
    name: "Gamma Auditor",
    class: "auditor",
    description: "Auditing agent for system inspection, federation compliance, and integrity scanning.",
    capabilities: ["auditing", "integrity-scan", "reporting"],
  },
];

export const getAgentLibraryItem = (id: string): AgentLibraryItem | null => {
  return AGENT_LIBRARY.find((a) => a.id === id) || null;
};








