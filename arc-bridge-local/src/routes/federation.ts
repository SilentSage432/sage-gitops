import { Router } from "express";
import type { FederationNode } from "../types/shared.js";

const router = Router();

router.get("/federation/nodes", (_req, res) => {
  const nodes: FederationNode[] = [
    { id: "prime-001", status: "online", role: "prime" },
    { id: "pi-worker-01", status: "offline", role: "worker" },
    { id: "pi-worker-02", status: "offline", role: "worker" }
  ];
  res.json(nodes);
});

export default router;

