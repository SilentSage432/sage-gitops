// Named scenario presets for simulation only.

export const scenarioProfiles = {
  "normal": {
    overrideRoles: null,
    forceOffline: [],
  },
  "edge-degraded": {
    overrideRoles: { edge: { unreachableChance: 0.5 } },
    forceOffline: [],
  },
  "core-offline": {
    overrideRoles: { core: { failureChance: 0.4 } },
    forceOffline: ["agent-alpha"],
  },
  "pi-cluster-only": {
    overrideRoles: { observer: { unreachableChance: 1.0 } },
    forceOffline: [],
  },
};

export function getScenario(name) {
  return scenarioProfiles[name] || scenarioProfiles["normal"];
}

