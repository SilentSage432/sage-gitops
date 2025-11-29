import express from "express";
import { validateActionHandler } from "./api/action-validate.js";
import { routeActionHandler } from "./api/action-route.js";
import { approveActionHandler, rejectActionHandler } from "./api/action-approval.js";
import { dispatchActionHandler } from "./api/action-dispatch.js";
import { simulateDispatchHandler } from "./api/action-sim-dispatch.js";
import { federationStateHandler } from "./api/federation-state.js";
import { dryRunHandler } from "./api/action-dry-run.js";
import { eligibleAgentsHandler } from "./api/action-eligible.js";
import { evaluateHandler } from "./api/action-evaluate.js";
import { simulateEnforcementHandler } from "./api/action-enforce-sim.js";
import { channelInitHandler } from "./api/channel-init.js";
import { channelDryrunHandler } from "./api/channel-dryrun.js";
import { simulateHandler } from "./api/simulate.js";

const router = express.Router();

// Phase 23: Action Validation API
// Passive validation endpoint - no execution performed
router.post("/federation/action/validate", (req, res) => {
  return validateActionHandler(req, res);
});

// Phase 24: Action Routing API
// Returns routing information - no dispatch or execution
router.post("/federation/action/route", (req, res) => {
  return routeActionHandler(req, res);
});

// Phase 25: Action Approval/Rejection API
// Passive operator consent - no execution performed
router.post("/federation/action/approve", (req, res) => {
  return approveActionHandler(req, res);
});

router.post("/federation/action/reject", (req, res) => {
  return rejectActionHandler(req, res);
});

// Phase 26: Action Dispatch API
// Returns dispatch envelope - no actual dispatch or execution
router.post("/federation/action/dispatch", (req, res) => {
  return dispatchActionHandler(req, res);
});

// Phase 27: Virtual Dispatch Bus API
// Simulates dispatch - logs envelope but no real delivery
router.post("/federation/action/dispatch/simulate", (req, res) => {
  return simulateDispatchHandler(req, res);
});

// Phase 27: Federation State API
// Exposes virtual bus log and system state
router.get("/federation/state", (req, res) => {
  return federationStateHandler(req, res);
});

// Phase 28: Dry-Run Executor API
// Simulates execution - no real execution or side effects
router.post("/federation/action/dry-run", (req, res) => {
  return dryRunHandler(req, res);
});

// Phase 31: Eligible Agents API
// Returns agents capable of handling an action type
router.post("/federation/action/eligible", (req, res) => {
  return eligibleAgentsHandler(req, res);
});

// Phase 35: Action Evaluation API
// Unified rule evaluation across all dimensions (read-only)
router.post("/federation/action/evaluate", (req, res) => {
  return evaluateHandler(req, res);
});

// Phase 36: Enforcement Simulation API
// Simulates permission/rejection logic without real enforcement
router.post("/federation/action/enforce/simulate", (req, res) => {
  return simulateEnforcementHandler(req, res);
});

// Phase 37: Execution Channel Initiation API
// Creates execution channel structure with enforcement + envelope (disabled)
router.post("/federation/action/channel/init", (req, res) => {
  return channelInitHandler(req, res);
});

// Phase 40: Execution Channel Dry-Run API
// Simulates executor through full channel (execution still disabled)
router.post("/api/channel/dryrun", (req, res) => {
  return channelDryrunHandler(req, res);
});

// Phase 48: Simulation Summary API
// Returns orchestration simulation for UI display (read-only)
router.post("/api/simulate", (req, res) => {
  return simulateHandler(req, res);
});

export default router;

