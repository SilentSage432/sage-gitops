// Returns routing information for an action.
// Does NOT send or execute anything.

import { defineAction } from "../federation/action-schema.js";
import { routeAction } from "../federation/command-routing.js";

export function routeActionHandler(req, res) {
  const { type, payload } = req.body;
  const action = defineAction(type, payload);

  const result = routeAction(action);

  return res.json({
    ok: true,
    routing: result,
    note: "Routing only. No execution.",
  });
}

