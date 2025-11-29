// Dry execution endpoint.

import { defineAction } from "../federation/action-schema.js";
import { routeAction } from "../federation/command-routing.js";
import { buildDispatchEnvelope } from "../federation/dispatch-envelope.js";
import { dryExecute } from "../federation/dry-executor.js";

export function dryRunHandler(req, res) {
  const { type, payload } = req.body;
  const action = defineAction(type, payload);

  const routing = routeAction(action);

  const envelope = buildDispatchEnvelope(
    action,
    routing.potentialTargets
  );

  const result = dryExecute(envelope);

  return res.json({
    ok: true,
    result,
    note: "Dry-run mode. No real execution",
  });
}

