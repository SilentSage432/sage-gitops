// The locked executor. Cannot execute anything yet.

import { getAgent, getRoleSimulationProfile } from "./agent-registry.js";
import { getScenario } from "./scenarios.js";

export function executor(actionEnvelope, scenario = "normal") {
  const agents = actionEnvelope.targets || [];
  const payload = actionEnvelope.payload;
  const action = {
    id: actionEnvelope.actionId,
    type: actionEnvelope.type,
  };

  const activeScenario = getScenario(scenario);

  const simulatedDispatch = agents.map((agentName) => {
    // Check if agent is force offline in scenario
    if (activeScenario.forceOffline.includes(agentName)) {
      return {
        agent: agentName,
        agentRole: (getAgent(agentName) || {}).role || "unknown",
        action,
        payload,
        simulated: true,
        feedback: {
          received: false,
          status: "unreachable",
          latencyMs: 0,
          note: "Simulated feedback only (force offline by scenario)",
        },
        retry: {
          attempted: true,
          retryCount: 2,
          fallbackUsed: true,
        },
      };
    }

    const agentInfo = getAgent(agentName) || { name: agentName, role: "unknown" };
    let profile = getRoleSimulationProfile(agentInfo.role);

    // Apply scenario role overrides if present
    if (activeScenario.overrideRoles && activeScenario.overrideRoles[agentInfo.role]) {
      const override = activeScenario.overrideRoles[agentInfo.role];
      profile = {
        ...profile,
        ...override,
      };
    }

    // Role-aware synthetic failure model
    const roll = Math.random();
    let status = "ok";

    if (roll < profile.failureChance) status = "failed";
    else if (roll < profile.failureChance + profile.unreachableChance) status = "unreachable";

    const retry = status !== "ok" ? {
      attempted: true,
      retryCount: status === "unreachable" ? 2 : 1,
      fallbackUsed: status === "unreachable",
    } : {
      attempted: false,
      retryCount: 0,
      fallbackUsed: false,
    };

    return {
      agent: agentName,
      agentRole: agentInfo.role,
      action,
      payload,
      simulated: true,
      feedback: {
        received: status !== "unreachable",
        status,
        latencyMs:
          profile.latencyBase +
          Math.floor(Math.random() * profile.latencyJitter),
        note: "Simulated feedback only (role-aware)",
      },
      retry,
    };
  });

  const summary = {
    total: agents.length,
    ok: simulatedDispatch.filter(d => d.feedback.status === "ok").length,
    failed: simulatedDispatch.filter(d => d.feedback.status === "failed").length,
    unreachable: simulatedDispatch.filter(d => d.feedback.status === "unreachable").length,
    retryAttempts: simulatedDispatch.filter(d => d.retry.attempted).length,
    fallbackUsed: simulatedDispatch.filter(d => d.retry.fallbackUsed).length,
  };

  // Convergence determination logic (simulation only)
  const converged =
    summary.failed === 0 && summary.unreachable === 0;

  return {
    ok: true,
    executed: false,
    dryRun: true,
    note: "Multi-agent dry-run simulation. Execution disabled.",
    envelope: actionEnvelope,
    scenario,
    dispatchPlan: simulatedDispatch,
    feedbackSummary: summary,
    convergence: {
      converged,
      outcome: converged
        ? "Simulated cluster reaches stable state"
        : "Simulated cluster fails to converge",
    },
  };
}

