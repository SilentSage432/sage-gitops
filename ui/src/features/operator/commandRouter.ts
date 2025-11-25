// --- E3 INTERPRETIVE MODE (phase 1) -----------------
// Provides gentle correction + suggestions for mistyped commands
// No AI — uses simple similarity + known registry

const knownCommands = [
  "clear",
  "help",
  "pi status",
  "pi list",
  "pi restart",
  "rho2 status",
  "agents list",
  "agents library",
  "agent create",
  "agent forge",
  "agent status",
  "nodes list",
];

// Export for help command display
export const getAllCommands = () => knownCommands.filter(cmd => cmd !== "help");

function suggestCommand(input: string) {
  const normalized = input.toLowerCase().trim();
  const match = knownCommands.find((cmd) =>
    cmd.startsWith(normalized) || normalized.startsWith(cmd)
  );
  return match || null;
}

export interface CommandResponse {
  type: "empty" | "clear" | "error" | "hint" | "info";
  message?: string;
}

export async function routeCommand(input: string): Promise<CommandResponse[]> {
  const command = input.trim();
  if (!command) return [{ type: "empty" }];

  // ✅ built-in clear command
  if (command === "clear") {
    return [{ type: "clear" }];
  }

  // ✅ help command - display all available commands
  if (command === "help" || command === "?") {
    const commands = getAllCommands();
    return [
      {
        type: "info",
        message: "Available SAGE PRIME commands:",
      },
      {
        type: "info",
        message: "",
      },
      ...commands.map((cmd) => ({
        type: "info" as const,
        message: `  • ${cmd}`,
      })),
      {
        type: "info",
        message: "",
      },
      {
        type: "hint",
        message: "Type 'help' or '?' to see this list again",
      },
    ];
  }

  // ✅ E3 suggestion mode
  const suggestion = suggestCommand(command);
  if (!suggestion) {
    return [
      {
        type: "error",
        message: `Unrecognized input: "${command}"`,
      },
      {
        type: "hint",
        message: "This resembles no known operator command",
      },
    ];
  }

  if (suggestion !== command) {
    return [
      {
        type: "hint",
        message: `Did you mean: ${suggestion}?`,
      },
    ];
  }

  // ✅ Agent commands
  if (command === "agents library") {
    return [
      {
        type: "info",
        message: "Opening Agent Library...",
      },
      {
        type: "hint",
        message: "Open the sidebar and select 'Agent Library' to view the canonical agent archive.",
      },
    ];
  }

  if (command === "agents list") {
    try {
      // Dynamically import to avoid circular dependencies
      const { listAgents } = await import("../../services/agentService");
      const agents = await listAgents();
      
      if (agents.length === 0) {
        return [
          {
            type: "info",
            message: "No agents found.",
          },
        ];
      }

      return [
        {
          type: "info",
          message: `Found ${agents.length} agent(s):`,
        },
        {
          type: "info",
          message: "",
        },
        ...agents.map((agent) => ({
          type: "info" as const,
          message: `  • ${agent.name} [${agent.id}]: ${agent.status.toUpperCase()} (${agent.class})`,
        })),
      ];
    } catch (error) {
      return [
        {
          type: "error",
          message: `Error listing agents: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ];
    }
  }

  if (command.startsWith("agent create") || command.startsWith("agent forge")) {
    return [
      {
        type: "hint",
        message: "Use the Agent Genesis panel to create and forge agents interactively.",
      },
      {
        type: "info",
        message: "Open the sidebar and select 'Agent Genesis' to begin.",
      },
    ];
  }

  if (command.startsWith("agent status")) {
    const parts = command.split(" ");
    if (parts.length < 3) {
      return [
        {
          type: "error",
          message: "Usage: agent status <agent-id>",
        },
      ];
    }

    const agentId = parts.slice(2).join(" ");
    try {
      const { getAgentStatus } = await import("../../services/agentService");
      const status = await getAgentStatus(agentId);
      
      return [
        {
          type: "info",
          message: `Agent: ${status.name} [${status.id}]`,
        },
        {
          type: "info",
          message: `Status: ${status.status.toUpperCase()}`,
        },
        {
          type: "info",
          message: `Class: ${status.class}`,
        },
        {
          type: "info",
          message: `Capabilities: ${status.capabilities.join(", ")}`,
        },
      ];
    } catch (error) {
      return [
        {
          type: "error",
          message: `Error getting agent status: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ];
    }
  }

  // ✅ future: real routing goes here
  return [
    {
      type: "info",
      message: `Command received: ${command}`,
    },
  ];
}

