import { initiateExecutionChannel } from "../federation/execution-channel.js";
import { defineAction } from "../federation/action-schema.js";
import { diffSimulations } from "../federation/simulation-diff.js";

export function simulateDiffHandler(req, res) {
  const {
    actionA,
    actionB,
    role = "sovereign",
    scenarioA = ["normal"],
    scenarioB = ["normal"],
    options = {},
  } = req.body;

  // Create action objects from type/payload or use existing action
  const actionObjA = actionA.type && actionA.id
    ? actionA
    : defineAction(actionA.type || "get-status", actionA.payload || {});
  const actionObjB = actionB.type && actionB.id
    ? actionB
    : defineAction(actionB.type || "get-status", actionB.payload || {});

  const channelA = initiateExecutionChannel(
    actionObjA,
    role,
    scenarioA,
    options
  );
  const simA = channelA.executor(channelA.envelope);

  const channelB = initiateExecutionChannel(
    actionObjB,
    role,
    scenarioB,
    options
  );
  const simB = channelB.executor(channelB.envelope);

  const diff = diffSimulations(simA, simB);

  return res.json({
    ok: true,
    diff,
    simA,
    simB,
    note: "Simulation diff only. Execution disabled.",
  });
}

