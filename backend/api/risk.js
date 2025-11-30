import express from "express";
import { buildExecutionCandidates } from "../federation/execution-candidates.js";
import { calculateRiskScore } from "../federation/risk-score.js";

export const router = express.Router();

router.get("/execution/risk", (req, res) => {
  const action = req.query.action || "none";
  
  const candidateSet = buildExecutionCandidates(action);
  const risk = calculateRiskScore(candidateSet);
  
  return res.json({
    ok: true,
    ...risk,
    note: "Read-only risk scoring. No execution.",
  });
});

