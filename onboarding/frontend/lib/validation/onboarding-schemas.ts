import { z } from 'zod';

// Company Schema
export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  email: z.string().email('Please enter a valid email address'),
  industry: z.enum(['Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Other']).optional(),
  size: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  domain: z.string().optional(),
  region: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// Data Regions Schema
export const dataRegionsSchema = z.object({
  sensitivity: z.enum(['None', 'PCI', 'PHI / HIPAA', 'High Confidential']).optional(),
  selectedRegions: z.array(z.string()).min(1, 'At least one region must be selected'),
  residencyRequired: z.boolean(),
});

export type DataRegionsFormData = z.infer<typeof dataRegionsSchema>;

// Agent Selection Schema
export const agentSelectionSchema = z.object({
  selectedAgents: z.array(z.string()).min(1, 'At least one agent must be selected'),
});

export type AgentSelectionFormData = z.infer<typeof agentSelectionSchema>;

// Access Config Schema - Local
export const accessConfigLocalSchema = z.object({
  authMethod: z.literal('local'),
  adminEmail: z.string().email('Please enter a valid admin email address'),
  tempPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  scimEnabled: z.boolean().optional(),
});

// Access Config Schema - SSO
export const accessConfigSSOSchema = z.object({
  authMethod: z.literal('sso'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  identityProvider: z.enum(['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Other']).optional(),
  callbackUrl: z.string().url().optional(),
  scimEnabled: z.boolean().optional(),
});

// Access Config Schema - Union
export const accessConfigSchema = z.discriminatedUnion('authMethod', [
  accessConfigLocalSchema,
  accessConfigSSOSchema,
]);

export type AccessConfigFormData = z.infer<typeof accessConfigSchema>;

// Full Onboarding Request Schema
export const onboardingRequestSchema = z.object({
  company: companySchema,
  dataRegionsConfig: dataRegionsSchema,
  agentSelection: agentSelectionSchema,
  accessConfig: accessConfigSchema,
});

export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;

