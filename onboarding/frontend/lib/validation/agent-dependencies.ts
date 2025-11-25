// Agent dependency validation utilities

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities?: string[];
  requirements?: {
    requiredAgents?: string[];
    requiredCapabilities?: string[];
    minRegions?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates agent selection against agent requirements
 */
export function validateAgentDependencies(
  selectedAgents: string[],
  allAgents: Agent[]
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (selectedAgents.length === 0) {
    result.isValid = false;
    result.errors.push('At least one agent must be selected');
    return result;
  }

  // Get selected agent objects
  const selectedAgentObjects = allAgents.filter((a) => selectedAgents.includes(a.id));
  const selectedCapabilities = new Set<string>();
  selectedAgentObjects.forEach((agent) => {
    agent.capabilities?.forEach((cap) => selectedCapabilities.add(cap));
  });

  // Check each selected agent's requirements
  for (const agent of selectedAgentObjects) {
    const requirements = agent.requirements;
    if (!requirements) continue;

    // Check required agents
    if (requirements.requiredAgents && requirements.requiredAgents.length > 0) {
      for (const requiredAgentId of requirements.requiredAgents) {
        if (!selectedAgents.includes(requiredAgentId)) {
          const requiredAgent = allAgents.find((a) => a.id === requiredAgentId);
          result.warnings.push(
            `${agent.name} recommends ${requiredAgent?.name || requiredAgentId} for optimal functionality`
          );
        }
      }
    }

    // Check required capabilities
    if (requirements.requiredCapabilities && requirements.requiredCapabilities.length > 0) {
      for (const requiredCap of requirements.requiredCapabilities) {
        if (!selectedCapabilities.has(requiredCap)) {
          result.warnings.push(
            `${agent.name} requires capability "${requiredCap}" which may not be available`
          );
        }
      }
    }

    // Check min regions (will be validated separately)
    if (requirements.minRegions && requirements.minRegions > 0) {
      // This will be checked in region validation
    }
  }

  return result;
}

