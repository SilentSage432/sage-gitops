/**
 * Agent Manifest Validator
 * Validates agent manifests before genesis orchestration
 */

import { AgentManifest, ValidationResult } from "../types/agentManifest";

const OFFICIAL_CAPABILITIES = [
  "ingest",
  "analyze",
  "classify",
  "respond",
  "monitor",
  "enforce",
  "stream",
  "predict",
];

const REQUIRES_SURVEILLANCE = ["auditor", "sentinel"];

/**
 * Validates an agent manifest
 * @param manifest - The agent manifest to validate
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateManifest(manifest: AgentManifest): ValidationResult {
  const errors: string[] = [];

  // Required fields check
  if (!manifest.name || manifest.name.trim().length === 0) {
    errors.push("Agent name is required");
  }

  if (!manifest.class || manifest.class.trim().length === 0) {
    errors.push("Agent class is required");
  }

  if (!manifest.capabilities || !Array.isArray(manifest.capabilities)) {
    errors.push("Capabilities must be an array");
    return { valid: false, errors };
  }

  // Capabilities validation
  if (manifest.capabilities.length === 0) {
    errors.push("At least one capability is required");
  }

  // Check for duplicate capabilities
  const uniqueCaps = new Set(manifest.capabilities);
  if (uniqueCaps.size !== manifest.capabilities.length) {
    errors.push("Duplicate capabilities are not allowed");
  }

  // Validate each capability is from official list
  const invalidCaps = manifest.capabilities.filter(
    (cap) => !OFFICIAL_CAPABILITIES.includes(cap)
  );
  if (invalidCaps.length > 0) {
    errors.push(`Invalid capabilities: ${invalidCaps.join(", ")}`);
  }

  // Custom class requires at least 1 capability (already checked above, but explicit)
  if (manifest.class === "custom" && manifest.capabilities.length === 0) {
    errors.push("Custom class agents must have at least one capability");
  }

  // Auditor/Sentinel classes require surveillance capability (monitor or enforce)
  if (REQUIRES_SURVEILLANCE.includes(manifest.class)) {
    const hasSurveillance = manifest.capabilities.some((cap) =>
      ["monitor", "enforce"].includes(cap)
    );
    if (!hasSurveillance) {
      errors.push(
        `${manifest.class} class agents must have at least one surveillance capability (monitor or enforce)`
      );
    }
  }

  // Name format validation (snake_case or kebab-case recommended)
  if (manifest.name && !/^[a-z0-9_-]+$/i.test(manifest.name)) {
    errors.push(
      "Agent name should only contain alphanumeric characters, underscores, or hyphens"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

