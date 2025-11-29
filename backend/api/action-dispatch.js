// Dispatch API (disabled).
// Returns the envelope but does not send it.

import { defineAction } from "../federation/action-schema.js";
import { routeAction } from "../federation/command-routing.js";
import { buildDispatchEnvelope } from "../federation/dispatch-envelope.js";

export function dispatchActionHandler(req, res) {
  const { type, payload } = req.body;
  const action = defineAction(type, payload);

  const routing = routeAction(action);

  const envelope = buildDispatchEnvelope(
    action,
    routing.potentialTargets
  );

  return res.json({
    ok: true,
    envelope,
    note: "Dispatch disabled. Envelope only.",
  });
}

