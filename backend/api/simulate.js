import { initiateExecutionChannel } from "../federation/execution-channel.js";
import { defineAction } from "../federation/action-schema.js";

export function simulateHandler(req, res) {
  const { type, payload, role = "sovereign", scenario = ["normal"], options = {} } = req.body;
  const action = defineAction(type, payload);

  const channel = initiateExecutionChannel(
    action,
    role,
    scenario,
    options
  );
  const result = channel.executor(channel.envelope);

  return res.json({
    ok: true,
    simulation: result,
    roleSummary: {
      byRole: result.dispatchPlan?.reduce((acc, d) => {
        const role = d.agentRole || "unknown";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}) || {},
    },
    note: "Simulation only. No execution.",
  });
}

