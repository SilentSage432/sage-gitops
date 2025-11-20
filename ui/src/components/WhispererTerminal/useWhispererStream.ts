import { useEffect, useState } from "react";

export function useWhispererStream() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/stream");

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const text =
          typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        setMessages((prev) => [...prev, text]);
      } catch {
        const text =
          typeof event.data === "string"
            ? event.data
            : JSON.stringify(event.data);
        setMessages((prev) => [...prev, text]);
      }
    };

    return () => ws.close();
  }, []);

  return { messages };
}

