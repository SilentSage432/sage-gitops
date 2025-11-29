// Phase 21: Passive Action Store + Audit Trail
// Endpoint to record an action WITHOUT executing it
// Store only, no execution, no dispatch logic
import { Router, Request, Response } from "express";
import { defineAction } from "../federation/action-schema.js";
import { recordAction } from "../federation/action-log.js";
import { isValidActionType } from "../federation/action-types.js";

const router = Router();

// POST /federation/action/record
// Records an action in the audit trail without executing it
router.post("/record", (req: Request, res: Response) => {
  try {
    const { type, payload, target, channel } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Missing action type" });
    }

    // Phase 21: Validate action type
    if (!isValidActionType(type)) {
      return res.status(400).json({ error: `Invalid action type: ${type}` });
    }

    // Phase 21: Define action schema and record it
    // No execution, no dispatch, no control - just storage
    const action = defineAction(type, payload || {}, { target, channel });
    recordAction(action);

    return res.json({ ok: true, action });
  } catch (error) {
    console.error("Error in action recording:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

