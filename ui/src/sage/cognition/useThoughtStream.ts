import { useEffect, useState } from "react";
import { ThoughtPacket, getThoughtChain } from "./ThoughtChain";

export function useThoughtStream() {
  const [thoughts, setThoughts] = useState<ThoughtPacket[]>(getThoughtChain());

  useEffect(() => {
    function handler(e: any) {
      const packet = e.detail as ThoughtPacket;
      setThoughts((prev) => {
        // Prevent duplicates by checking if ID already exists
        if (prev.some((t) => t.id === packet.id)) {
          return prev;
        }
        return [...prev, packet];
      });
    }

    window.addEventListener("SAGE_THOUGHT", handler);
    return () => window.removeEventListener("SAGE_THOUGHT", handler);
  }, []);

  return thoughts;
}

