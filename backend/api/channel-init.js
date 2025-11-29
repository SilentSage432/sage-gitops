import { initiateExecutionChannel } from "../federation/execution-channel.js";
import { defineAction } from "../federation/action-schema.js";

export function channelInitHandler(req, res) {
  const { type, payload, role = "sovereign" } = req.body;
  const action = defineAction(type, payload);

  const result = initiateExecutionChannel(action, role);

  return res.json({
    ok: true,
    channel: result,
    requiresConsent: result.requiresConsent,
    note: "Execution channel initiated (disabled).",
  });
}

