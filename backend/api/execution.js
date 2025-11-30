import express from "express";
import { previewExecutionGate } from "../federation/execution-gate-preview.js";

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

