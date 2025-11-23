import { createResponse, CommandResponse } from "./commandResponse";
import { commandRegistry } from "./commandRegistry";

export const routeCommand = async (
  input: string,
  emit: (r: CommandResponse) => void
): Promise<void> => {
  const [command] = input.trim().split(" ");
  emit(createResponse(command, "received", "Command received."));

  await new Promise((res) => setTimeout(res, 300));

  // Check for unknown commands
  const match = commandRegistry.find((c) => c.name === command);
  if (!match) {
    emit(createResponse(command, "failed", "Unknown command."));
    return;
  }

  // Federation-ready hook
  if (command === "telemetry") {
    emit(createResponse(command, "processing", "Routing to federation..."));
    await new Promise((res) => setTimeout(res, 600));
    emit(
      createResponse(
        command,
        "completed",
        "Federation link ready (placeholder)."
      )
    );
    return;
  }

  emit(
    createResponse(
      command,
      "processing",
      "Executing locally (placeholder)..."
    )
  );

  await new Promise((res) => setTimeout(res, 500));

  emit(
    createResponse(
      command,
      "completed",
      "Local execution completed (placeholder)."
    )
  );
};

