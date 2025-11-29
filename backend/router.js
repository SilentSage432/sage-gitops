import express from "express";
import { validateActionHandler } from "./api/action-validate.js";
import { routeActionHandler } from "./api/action-route.js";
import { approveActionHandler, rejectActionHandler } from "./api/action-approval.js";
import { dispatchActionHandler } from "./api/action-dispatch.js";
import { simulateDispatchHandler } from "./api/action-sim-dispatch.js";
import { federationStateHandler } from "./api/federation-state.js";

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

export default router;

