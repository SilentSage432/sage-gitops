import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api/client";
import { createStream } from "@/lib/ws/stream";

export interface WhispererMessage {
  id: string;
  role: "operator" | "system";
  text: string;
  timestamp: number;
}

export function useWhispererBridge() {
  const [messages, setMessages] = useState<WhispererMessage[]>([]);

  useEffect(() => {
    const stream = createStream((evt) => {
      if (evt.type === "whisperer-message") {
        setMessages((prev) => [...prev, evt.payload]);
      }
    });
    return () => stream.close();
  }, []);

  async function sendMessage(text: string) {
    await apiPost("/api/whisperer/message", { text });
  }

  return { messages, sendMessage };
}

