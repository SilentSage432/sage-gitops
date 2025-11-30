import express from "express";
import { buildExecutionCandidates } from "../federation/execution-candidates.js";
import { forecastOutcome } from "../federation/forecast.js";

export const router = express.Router();

router.get("/execution/forecast", (req, res) => {
  const action = req.query.action || "none";
  
  const candidateSet = buildExecutionCandidates(action);
  const result = forecastOutcome(action, candidateSet);
  
  return res.json({
    ok: true,
    ...result,
    note: "Read-only outcome forecast. No execution.",
  });
});

