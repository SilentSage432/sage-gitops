// Federation state API - exposes virtual bus and system state.

import { getVirtualBusLog } from "../federation/virtual-bus.js";
import { agentCapabilities } from "../federation/agent-capabilities.js";

export function federationStateHandler(req, res) {
  res.json({
    ok: true,
    virtualBus: getVirtualBusLog(),
    agentCapabilities,
  });
}

