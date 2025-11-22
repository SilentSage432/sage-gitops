import { CognitionEvent } from "./eventTypes";
import { getPriority } from "./semanticRouter";

export interface EscalationHandlers {
  operatorNotify: (msg: string) => void;
  systemFlag: (e: CognitionEvent) => void;
}

export function escalateEvent(
  event: CognitionEvent,
  handlers: EscalationHandlers
) {
  const priority = getPriority(event);

  // ✅ Tier 1 — Critical → Immediate operator alert
  if (priority === 1) {
    const message = event.type === "system.error" 
      ? event.message 
      : event.type.toUpperCase();
    handlers.operatorNotify(
      `⚠️ CRITICAL: ${message}`
    );
    handlers.systemFlag(event);
    return;
  }

  // ✅ Tier 2 — Warning → queued operator notice
  if (priority === 2) {
    const message = event.type === "system.warning" 
      ? event.message 
      : event.type;
    handlers.operatorNotify(`⚠️ Warning: ${message}`);
    return;
  }

  // ✅ Tier 3 — State changes → silent system-level update
  if (priority === 3) {
    handlers.systemFlag(event);
  }
}

