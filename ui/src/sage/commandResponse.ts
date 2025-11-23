export type CommandResponse = {
  command: string;
  status: "received" | "processing" | "completed" | "failed";
  message: string;
  timestamp: number;
};

export const createResponse = (
  command: string,
  status: CommandResponse["status"],
  message: string
): CommandResponse => ({
  command,
  status,
  message,
  timestamp: Date.now(),
});

