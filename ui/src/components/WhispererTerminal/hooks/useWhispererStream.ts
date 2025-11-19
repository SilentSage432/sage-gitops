import { useEffect } from "react";
import { arcBridge } from "@/lib/arcBridge";

interface WhispererStreamPayload {
  type: string;
  content?: string;
  message?: string;
  ts?: number;
}

export function useWhispererStream(addMessage: (msg: { type: string; content: string; timestamp: number }) => void) {
  useEffect(() => {
    arcBridge.connect();

    const off = arcBridge.onMessage((incoming: unknown) => {
      const payload = incoming as WhispererStreamPayload;
      const content =
        payload.content ?? payload.message ?? (typeof incoming === "string" ? incoming : JSON.stringify(incoming));

      addMessage({
        type: payload.type ?? "system",
        content,
        timestamp: payload.ts ?? Date.now(),
      });
    });

    return () => off();
  }, [addMessage]);
}

