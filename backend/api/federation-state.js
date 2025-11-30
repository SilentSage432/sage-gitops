// Federation state API - exposes virtual bus and system state.

import { getVirtualBusLog } from "../federation/virtual-bus.js";
import { agentCapabilities } from "../federation/agent-capabilities.js";
import { listAgents } from "../federation/agent-registry.js";
import { getHardwareKey } from "../federation/operator-model.js";
import { currentOperator } from "../identity/operator-session.js";

export function federationStateHandler(req, res) {
  const operator = currentOperator();
  const hardwareKey = getHardwareKey();
  
  res.json({
    ok: true,
    virtualBus: getVirtualBusLog(),
    agentCapabilities,
    agents: listAgents(),
    operator: operator ? {
      ...operator,
      hardwareKey: hardwareKey.id ? hardwareKey : null,
    } : null,
  });
}

