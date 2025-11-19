export interface IntentResult {
  type: "arc" | "federation" | "rho2" | "agent" | "system" | "ui" | "unknown";
  action: string;
  target?: string;
  payload?: any;
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

