import { resolveContext } from "./contextEngine";

export interface IntentResult {
  type: "arc" | "federation" | "rho2" | "agent" | "system" | "ui" | "unknown";
  action: string;
  target?: string;
  payload?: any;
  resolvedFromContext?: boolean;
}

export function parseIntent(input: string): IntentResult {
  const text = input.toLowerCase().trim();

  // === ARC PANEL ROUTING ===
  if (/open.*theta/.test(text)) return { type: "ui", action: "open-panel", target: "arc-theta" };
  if (/open.*sigma/.test(text)) return { type: "ui", action: "open-panel", target: "arc-sigma" };
  if (/open.*omega/.test(text)) return { type: "ui", action: "open-panel", target: "arc-omega" };
  if (/open.*rho/.test(text)) return { type: "ui", action: "open-panel", target: "arc-rho2" };
  if (/open.*lambda/.test(text)) return { type: "ui", action: "open-panel", target: "arc-lambda" };
  if (/open.*chi/.test(text)) return { type: "ui", action: "open-panel", target: "arc-chi" };
  if (/open.*xi/.test(text)) return { type: "ui", action: "open-panel", target: "arc-xi" };
  if (/open.*mu/.test(text)) return { type: "ui", action: "open-panel", target: "arc-mu" };
  if (/open.*nu/.test(text)) return { type: "ui", action: "open-panel", target: "arc-nu" };
  if (/open.*omicron/.test(text)) return { type: "ui", action: "open-panel", target: "arc-omicron" };
  if (/open.*zeta/.test(text)) return { type: "ui", action: "open-panel", target: "arc-zeta" };
  if (/open.*iota/.test(text)) return { type: "ui", action: "open-panel", target: "arc-iota" };
  if (/open.*epsilon/.test(text)) return { type: "ui", action: "open-panel", target: "arc-epsilon" };
  if (/open.*delta/.test(text)) return { type: "ui", action: "open-panel", target: "arc-delta" };

  // === FEDERATION PANELS ===
  if (/open.*pi|kluster/.test(text))
    return { type: "ui", action: "open-panel", target: "pi-kluster" };

  if (/open.*onboarding/.test(text))
    return { type: "ui", action: "open-panel", target: "onboarding-nexus" };

  if (/open.*nodes/.test(text))
    return { type: "ui", action: "open-panel", target: "nodes" };

  // === Rho² Commands ===
  if (/rotate|epoch/.test(text))
    return { type: "rho2", action: "simulate-epoch" };

  // === FEDERATION METRICS ===
  if (/status|health|heartbeat/.test(text))
    return { type: "system", action: "system-status" };

  // === AGENTS ===
  if (/agents|show agents|agent list/.test(text))
    return { type: "ui", action: "open-panel", target: "agents" };

  return { type: "unknown", action: "none" };
}

export function parseIntentWithContext(
  input: string,
  memory: any
) {
  const base = parseIntent(input);
  const contextual = resolveContext(input, memory);

  if (contextual) {
    return { ...contextual, resolvedFromContext: true };
  }

  return base;
}

