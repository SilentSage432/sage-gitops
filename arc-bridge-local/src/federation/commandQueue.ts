// Phase 15.1: Command Envelope Standard
// Internal registry for command messages - NO EXECUTION, pure message storage

export interface Command {
  target: string;
  cmd: string;
  data?: Record<string, unknown>;
  channel?: string;
  ts: number;
}

const commands: Command[] = [];

export function enqueueCommand(cmd: Omit<Command, "ts">): void {
  commands.push({
    ...cmd,
    channel: cmd.channel || "node",
    ts: Date.now(),
  });
}

export function getCommandsForTarget(target: string): Command[] {
  return commands.filter((c) => c.target === target);
}

export function getRecentCommands(): Command[] {
  return commands.slice(-200);
}

