import express from "express";
import { buildExecutionCandidates } from "../federation/execution-candidates.js";

export const router = express.Router();

router.get("/execution/candidates", (req, res) => {
  const action = req.query.action || "none";
  const result = buildExecutionCandidates(action);
  
  return res.json({
    ok: true,
    ...result,
    note: "Read-only candidate pipeline. No execution.",
  });
});

