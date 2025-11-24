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

  // ✅ future: real routing goes here
  return [
    {
      type: "info",
      message: `Command received: ${command}`,
    },
  ];
}

