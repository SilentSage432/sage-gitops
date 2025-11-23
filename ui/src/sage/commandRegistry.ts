export type CommandDefinition = {
  name: string;
  description: string;
  category: string;
  execution: "local" | "federated" | "hybrid";
  requiresAuthority?: boolean;
};

export const commandRegistry: CommandDefinition[] = [
  {
    name: "status",
    description: "Report current system status.",
    category: "system",
    execution: "local",
  },
  {
    name: "telemetry",
    description: "Request live telemetry stream.",
    category: "system",
    execution: "federated",
  },
  {
    name: "scan",
    description: "Initiate mesh awareness scan.",
    category: "operations",
    execution: "hybrid",
    requiresAuthority: true,
  },
];

