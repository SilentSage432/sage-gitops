import express from "express";
import { previewExecutionGate } from "../federation/execution-gate-preview.js";
import { createExecutionEnvelope } from "../federation/execution-envelope.js";

export const router = express.Router();

router.get("/execution/gate/preview", (req, res) => {
  const action = req.query.action || "none";
  const result = previewExecutionGate(action);
  
  return res.json({
    ok: true,
    ...result,
    note: "Execution gate preview only. No state changes. No execution.",
  });
});

router.post("/execution/envelope", (req, res) => {
  const { action, context } = req.body;
  
  if (!action) {
    return res.status(400).json({
      ok: false,
      error: "action is required",
      note: "Execution envelope requires an action to be specified.",
    });
  }
  
  const envelope = createExecutionEnvelope(action, context || {});
  
  return res.json({
    status: "accepted",
    envelope,
    note: "Envelope created. No execution performed. Backend remains SAFE: always simulate, no state changes, no execution.",
  });
});

