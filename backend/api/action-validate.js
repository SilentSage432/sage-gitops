// Passive action validation endpoint.
// DOES NOT execute anything.

import { defineAction } from "../federation/action-schema.js";
import { validateAction } from "../federation/action-validate.js";

export function validateActionHandler(req, res) {
  const { type, payload } = req.body;
  const action = defineAction(type, payload);

  const result = validateAction(action);

  return res.json({
    ok: result.ok,
    errors: result.errors,
    note: "Validation only. No execution performed.",
  });
}

