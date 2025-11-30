import express from "express";
import { previewExecutionGate } from "../federation/execution-gate-preview.js";
import { createExecutionEnvelope } from "../federation/execution-envelope.js";
import { checkEnvelopeAgainstGate, checkExecutionGate } from "../federation/execution-gate.js";
import { routeEnvelope, validateHardwareForDestination } from "../federation/execution-channel.js";
import { simulateExecution } from "../federation/execution-simulator.js";
import { recordExecutionAttempt, getExecutionLedger } from "../federation/execution-ledger.js";

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

router.post("/execution/envelope/check", (req, res) => {
  const { action, context } = req.body;
  
  if (!action) {
    return res.status(400).json({
      ok: false,
      error: "action is required",
      note: "Envelope check requires an action to be specified.",
    });
  }
  
  const result = checkEnvelopeAgainstGate(action, context || {});
  
  return res.json({
    ok: true,
    ...result,
    note: "Extremely safe endpoint: never executes, only validates. This will later become the first checkpoint before soft execution.",
  });
});

router.post("/execution/route", (req, res) => {
  const { action, context } = req.body;
  
  if (!action) {
    return res.status(400).json({
      ok: false,
      error: "action is required",
      note: "Envelope routing requires an action to be specified.",
    });
  }
  
  const result = routeEnvelope(action, context || {});
  
  return res.json({
    ok: true,
    ...result,
    note: "Purely read-only routing. No action. No mutation. No state change.",
  });
});

router.post("/execution/simulate", (req, res) => {
  const { action, context } = req.body;
  
  if (!action) {
    return res.status(400).json({
      ok: false,
      error: "action is required",
      note: "Execution simulation requires an action to be specified.",
    });
  }
  
  // Phase 78: Passive Enforcement Simulation
  // Create envelope, check gate, validate hardware, and simulate execution
  const envelope = createExecutionEnvelope(action, context || {});
  const gate = checkExecutionGate(action);
  const hardwareAllowed = validateHardwareForDestination(envelope);
  const simulationResult = simulateExecution(envelope, gate, hardwareAllowed);
  
  // Phase 79: Passive Execution Ledger
  // Record execution attempt (passive - we don't change execution outcome)
  recordExecutionAttempt({
    envelope,
    gate,
    hardwareAllowed,
    result: simulationResult,
  });
  
  // For the first time ever, we have a complete "would I be allowed?" chain
  // Still safe.
  
  return res.json({
    ok: true,
    envelope,
    gate,
    hardwareAllowed,
    result: simulationResult,
    note: "Complete authorization simulation. Returns deterministic results. Still safe - no execution, no blocking, no state changes.",
  });
});

router.get("/execution/ledger", (req, res) => {
  // Phase 79: Passive Execution Ledger
  // Returns all execution attempts recorded in the ledger
  // This gives SAGE Prime the ability to show:
  // - who attempted what
  // - where
  // - with what identity
  // - under what mode
  // - with what result
  
  const ledger = getExecutionLedger();
  
  return res.json({
    ok: true,
    ledger,
    count: ledger.length,
    note: "Passive execution ledger. Records all execution requests and pipeline results without executing anything.",
  });
});

