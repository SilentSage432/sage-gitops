import React, { createContext, useContext, useState, useCallback } from "react";

interface MemoryEntry {
  id: string;
  text: string;
  timestamp: number;
  tag?: string; // e.g., "rho2", "operator", "alert"
}

interface OperatorMemoryState {
  memory: MemoryEntry[];
  remember: (text: string, tag?: string) => void;
  recallByTag: (tag: string) => MemoryEntry[];
  recallRecent: (limit?: number) => MemoryEntry[];
  clearMemory: () => void;
}

const OperatorMemoryContext = createContext<OperatorMemoryState | null>(null);

export function OperatorMemoryProvider({ children }: { children: React.ReactNode }) {
  const [memory, setMemory] = useState<MemoryEntry[]>([]);

  const remember = useCallback((text: string, tag?: string) => {
    setMemory((prev) => [
      ...prev.slice(-49), // keep last 50 entries
      { id: crypto.randomUUID(), text, timestamp: Date.now(), tag }
    ]);
  }, []);

  const recallByTag = useCallback(
    (tag: string) => memory.filter((m) => m.tag === tag).slice(-10),
    [memory]
  );

  const recallRecent = useCallback(
    (limit = 5) => memory.slice(-limit),
    [memory]
  );

  const clearMemory = useCallback(() => setMemory([]), []);

  return (
    <OperatorMemoryContext.Provider
      value={{ memory, remember, recallByTag, recallRecent, clearMemory }}
    >
      {children}
    </OperatorMemoryContext.Provider>
  );
}

export function useOperatorMemory() {
  const ctx = useContext(OperatorMemoryContext);
  if (!ctx) throw new Error("useOperatorMemory must be used inside provider");
  return ctx;
}

