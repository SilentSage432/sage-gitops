import { commandRegistry } from "./commandRegistry";
import { createResponse, CommandResponse } from "./commandResponse";

export const routeCommand = async (
  input: string
): Promise<CommandResponse> => {
  const [command] = input.trim().split(" ");
  const match = commandRegistry.find((c) => c.name === command);

  if (!match) {
    return createResponse(command, "failed", "Unknown command.");
  }

  // Phase-ready for future federation routing
  if (match.execution === "federated") {
    return createResponse(command, "processing", "Routing to federation...");
  }

  return createResponse(
    command,
    "completed",
    "Command executed locally (placeholder)."
  );
};

