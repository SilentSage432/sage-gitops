/**
 * useAgentLibrary Hook
 * Small hook used by both AgentOverview and Genesis
 */

import { useState, useEffect } from "react";
import { AGENT_LIBRARY, AgentLibraryItem } from "./agentLibraryRegistry";

export function useAgentLibrary() {
  const [library, setLibrary] = useState<AgentLibraryItem[]>([]);

  useEffect(() => {
    // Later this becomes live-fed from the Pi cluster
    setLibrary(AGENT_LIBRARY);
  }, []);

  const get = (id: string): AgentLibraryItem | null => {
    return AGENT_LIBRARY.find((a) => a.id === id) || null;
  };

  return { library, get };
}

