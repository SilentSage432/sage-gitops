export interface OperatorMemory {
  lastPanel?: string;
  lastIntent?: any;
  lastAction?: string;
  lastMessages: string[];
}

export const createInitialMemory = (): OperatorMemory => ({
  lastPanel: undefined,
  lastIntent: undefined,
  lastAction: undefined,
  lastMessages: []
});

/**
 * Resolve contextual phrases:
 * "previous", "that arc", "show it again", "open that"
 */
export function resolveContext(text: string, mem: OperatorMemory) {
  const lowered = text.toLowerCase();

  // "previous arc", "last arc", "the one before"
  if (/(previous|last).*(arc)/.test(lowered) && mem.lastPanel) {
    return { type: "ui", action: "open-panel", target: mem.lastPanel };
  }

  // "open that", "open it"
  if (/open (that|it)/.test(lowered) && mem.lastIntent?.target) {
    return {
      type: "ui",
      action: "open-panel",
      target: mem.lastIntent.target
    };
  }

  // "show it again"
  if (/show (it|that) again/.test(lowered) && mem.lastAction) {
    return { type: "system", action: mem.lastAction };
  }

  return null;
}

