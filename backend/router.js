import express from "express";
import { validateActionHandler } from "./api/action-validate.js";
import { routeActionHandler } from "./api/action-route.js";

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

export default router;

