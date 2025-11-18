import { apiGet } from "@/lib/api/client";
import { useEffect, useState } from "react";

export interface FederationNode {
  id: string;
  status: "online" | "offline";
  role: "prime" | "worker";
}

export function useNodes() {
  const [nodes, setNodes] = useState<FederationNode[]>([]);

  useEffect(() => {
    apiGet<FederationNode[]>("/api/federation/nodes").then(setNodes);
  }, []);

  return nodes;
}

