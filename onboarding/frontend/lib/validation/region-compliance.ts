// Region compliance validation utilities

export interface Region {
  id: string;
  name: string;
  location: string;
  compliance?: string[];
  allowedSensitivity?: string[];
}

export type SensitivityLevel = 'None' | 'PCI' | 'PHI / HIPAA' | 'High Confidential';

export interface ComplianceValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  complianceBadges: string[];
}

/**
 * Validates region selection against sensitivity requirements
 */
export function validateRegionCompliance(
  selectedRegions: string[],
  sensitivity: SensitivityLevel | undefined,
  allRegions: Region[],
  residencyRequired: boolean
): ComplianceValidationResult {
  const result: ComplianceValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    complianceBadges: [],
  };

  if (selectedRegions.length === 0) {
    result.isValid = false;
    result.errors.push('At least one region must be selected');
    return result;
  }

  // Get selected region objects
  const selectedRegionObjects = allRegions.filter((r) => selectedRegions.includes(r.id));

  // Collect all compliance badges
  const complianceSet = new Set<string>();
  selectedRegionObjects.forEach((region) => {
    region.compliance?.forEach((comp) => complianceSet.add(comp));
  });
  result.complianceBadges = Array.from(complianceSet);

  // Validate sensitivity against allowed regions
  if (sensitivity && sensitivity !== 'None') {
    for (const region of selectedRegionObjects) {
      const allowedSensitivity = region.allowedSensitivity || [];
      if (!allowedSensitivity.includes(sensitivity)) {
        result.isValid = false;
        result.errors.push(
          `${region.name} does not support ${sensitivity} data. Please select a different region or adjust sensitivity level.`
        );
      }
    }
  }

  // Check residency requirements
  if (residencyRequired) {
    // If residency is required, all regions should be in the same compliance zone
    const complianceZones = new Set<string>();
    selectedRegionObjects.forEach((region) => {
      // Group by compliance standards
      region.compliance?.forEach((comp) => complianceZones.add(comp));
    });

    if (complianceZones.size > 1) {
      result.warnings.push(
        'Data residency is required, but selected regions span multiple compliance zones. Consider selecting regions from the same zone.'
      );
    }
  }

  // HIPAA/PCI specific warnings
  if (sensitivity === 'PHI / HIPAA' || sensitivity === 'HIPAA') {
    const hasHIPAACompliance = selectedRegionObjects.some((r) =>
      r.compliance?.includes('HIPAA')
    );
    if (!hasHIPAACompliance) {
      result.warnings.push(
        'HIPAA data requires HIPAA-compliant regions. Consider selecting US-East or US-West.'
      );
    }
  }

  if (sensitivity === 'PCI') {
    const hasPCICompliance = selectedRegionObjects.some((r) => r.compliance?.includes('PCI-DSS'));
    if (!hasPCICompliance) {
      result.warnings.push(
        'PCI data requires PCI-DSS-compliant regions. Consider selecting US-East or US-West.'
      );
    }
  }

  return result;
}

