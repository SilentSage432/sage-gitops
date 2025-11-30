import express from "express";
import { checkExecutionGate } from "../federation/execution-gate.js";

export const router = express.Router();

router.get("/execution/gate", (req, res) => {
  const action = req.query.action || "none";
  const gate = checkExecutionGate(action);
  
  return res.json({
    ok: true,
    ...gate,
    note: "Read-only execution gate check. Execution disabled.",
  });
});

