import express from "express";
import { validateActionHandler } from "./api/action-validate.js";

const router = express.Router();

// Phase 23: Action Validation API
// Passive validation endpoint - no execution performed
router.post("/federation/action/validate", (req, res) => {
  return validateActionHandler(req, res);
});

export default router;

