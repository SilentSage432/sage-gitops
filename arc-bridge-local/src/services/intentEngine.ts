export function analyzeIntent(text: string) {
  const t = text.toLowerCase().trim();

  // Core patterns
  if (t.includes("open arc") || t.startsWith("arc ")) {
    const arcMatch = t.match(/(theta|sigma|omega|rho|rho2|lambda|chi)/i);
    return {
      intent: "OPEN_ARC",
      target: arcMatch?.[0] ?? null,
      confidence: arcMatch ? 0.9 : 0.5
    };
  }

  if (t.includes("mesh") || t.includes("system status")) {
    return {
      intent: "QUERY_STATUS",
      target: "mesh",
      confidence: 0.85
    };
  }

  if (t.includes("spawn agent") || t.includes("create agent")) {
    const match = t.match(/agent ([a-zA-Z]+)/);
    return {
      intent: "SPAWN_AGENT",
      agent_type: match?.[1] ?? null,
      confidence: match ? 0.88 : 0.6
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: 0.2
  };
}

export default { analyzeIntent };

