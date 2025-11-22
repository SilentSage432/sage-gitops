import { useEffect, useState } from "react";
import { useWhispererStream } from "../../components/WhispererTerminal/useWhispererStream";
import { useUIPulse } from "../../core/UIPulseContext";
import { useUIShockwave } from "../../core/UIShockwaveContext";

interface SemanticEvent {
  priority?: "high" | "medium" | "low";
  semanticTag?: string;
  text?: string;
}

/**
 * ENFL — Emergent Neural Feedback Loop
 * Listens to semantic event stream and triggers subtle UI feedback.
 */
export function useENFL() {
  const { messages } = useWhispererStream();
  const { pulseSoft } = useUIPulse();
  const { shockwaveMinor } = useUIShockwave();
  const [latest, setLatest] = useState<SemanticEvent | null>(null);

  // Extract latest message and parse for semantic signals
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    let parsed: SemanticEvent | null = null;

    try {
      const data = JSON.parse(lastMessage);
      parsed = {
        priority: data.priority || (data.level === "error" ? "high" : "medium"),
        semanticTag: data.semanticTag || data.tag || data.type,
        text: data.text || data.message || lastMessage,
      };
    } catch {
      // If not JSON, treat as plain text and check for patterns
      const text = lastMessage.toLowerCase();
      parsed = {
        priority: text.includes("error") || text.includes("critical") ? "high" : "medium",
        semanticTag: text.includes("novel") || text.includes("pattern") ? "novel-pattern" : undefined,
        text: lastMessage,
      };
    }

    setLatest(parsed);
  }, [messages]);

  useEffect(() => {
    if (!latest) return;

    // High-signal events trigger soft UI pulse
    if (latest.priority === "high") {
      pulseSoft();
    }

    // Rare / novel patterns trigger micro-shockwave
    if (latest.semanticTag === "novel-pattern") {
      shockwaveMinor();
    }
  }, [latest, pulseSoft, shockwaveMinor]);
}

