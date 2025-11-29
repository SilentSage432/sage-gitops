import { initiateExecutionChannel } from "../federation/execution-channel.js";
import { defineAction } from "../federation/action-schema.js";

export function channelDryrunHandler(req, res) {
  const { type, payload, role = "sovereign" } = req.body;
  const action = defineAction(type, payload);

  const channel = initiateExecutionChannel(action, role);

  const result = channel.executor(channel.envelope);

  return res.json({
    ok: true,
    dryRun: true,
    channel,
    executorResult: result,
    note: "Dry-run simulation only. Execution disabled.",
  });
}

