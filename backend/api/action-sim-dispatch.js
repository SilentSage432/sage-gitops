// Virtual dispatch. No execution.

import { defineAction } from "../federation/action-schema.js";
import { routeAction } from "../federation/command-routing.js";
import { buildDispatchEnvelope } from "../federation/dispatch-envelope.js";
import { simulateSend } from "../federation/virtual-bus.js";

export function simulateDispatchHandler(req, res) {
  const { type, payload } = req.body;
  const action = defineAction(type, payload);

  const routing = routeAction(action);

  const envelope = buildDispatchEnvelope(
    action,
    routing.potentialTargets
  );

  // Simulate sending the envelope (just logs it)
  simulateSend(envelope);

  return res.json({
    ok: true,
    envelope,
    note: "Simulated dispatch only. No execution.",
  });
}

