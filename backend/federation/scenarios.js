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

export function combineScenarios(names = []) {
  // expand names to full profiles
  const profiles = names.map(n => getScenario(n));

  const merged = {
    overrideRoles: {},
    forceOffline: [],
  };

  for (const p of profiles) {
    // merge offline nodes
    merged.forceOffline.push(...p.forceOffline);

    // merge role overrides
    if (p.overrideRoles) {
      Object.entries(p.overrideRoles).forEach(([role, override]) => {
        merged.overrideRoles[role] = {
          ...(merged.overrideRoles[role] || {}),
          ...override,
        };
      });
    }
  }

  return merged;
}

