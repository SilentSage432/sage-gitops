import express from "express";
import { validateActionHandler } from "./api/action-validate.js";
import { routeActionHandler } from "./api/action-route.js";
import { approveActionHandler, rejectActionHandler } from "./api/action-approval.js";
import { dispatchActionHandler } from "./api/action-dispatch.js";

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

export default router;

