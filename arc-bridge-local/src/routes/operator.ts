// Phase 17.4: Operator Registration Flow (Passive, Non-auth)
// Passive operator registration endpoint
// This does NOT authenticate or enforce security yet
// Just the model - no permissions, no enforcement, no control paths
import { Router, Request, Response } from "express";
import { registerOperator } from "../federation/operator.js";

const router = Router();

// POST /federation/operator/register
// Registers an operator identity (passive, non-authenticated)
router.post("/register", (req: Request, res: Response) => {
  try {
    const op = req.body;

    if (!op?.id) {
      return res.status(400).json({ error: "Missing operator id" });
    }

    // Phase 17.4: Register operator with provided ID
    // Source defaults to "pending" until proper authentication is added
    registerOperator({
      id: op.id,
      source: op.source || "pending",
      metadata: op.metadata,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error in operator registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

