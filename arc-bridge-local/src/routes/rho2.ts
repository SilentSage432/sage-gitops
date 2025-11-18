import { Router } from "express";
import type { Rho2Status } from "../types/shared.js";

const router = Router();

router.get("/rho2/status", (_req, res) => {
  const status: Rho2Status = {
    shards: 7,
    rotation: "active",
    nextRotation: new Date(Date.now() + 1000 * 60 * 10).toISOString()
  };

  res.json(status);
});

export default router;

