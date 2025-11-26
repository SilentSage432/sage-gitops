import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Cleanup legacy localStorage keys
if (typeof window !== 'undefined') {
  const legacyKeys = ['wizardCompany', 'wizardAgents', 'wizardAccess', 'wizardData', 'wizard-store'];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
}

export interface CompanyData {
  name: string;
  industry?: 'Healthcare' | 'Finance' | 'Retail' | 'Manufacturing' | 'Other';
  size?: '1-10' | '11-50' | '51-200' | '200+';
  email: string;
  // Legacy fields for backward compatibility
  domain?: string;
  region?: string;
}

export interface DataRegion {
  id: string;
  name: string;
  selected: boolean;
}

export interface DataRegionsConfig {
  sensitivity?: 'None' | 'PCI' | 'PHI / HIPAA' | 'High Confidential';
  selectedRegions: string[];
  residencyRequired: boolean;
}

export interface AgentPlan {
  plan: 'starter' | 'growth' | 'enterprise' | null;
  agentCount: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
}

export interface AgentSelection {
  selectedAgents: string[];
}

export interface AccessModel {
  model: 'rbac' | 'abac' | 'hybrid' | null;
  description: string;
}

export interface AccessConfig {
  authMethod: 'local' | 'sso';
  scimEnabled?: boolean;
  // SSO fields
  identityProvider?: 'Okta' | 'Azure AD' | 'Google Workspace' | 'OneLogin' | 'Other';
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  // Local account fields
  adminEmail?: string;
  tempPassword?: string;
}

export interface OnboardingProgress {
  currentStep: number;
  completed: boolean;
}

interface OnboardingState {
  company: CompanyData | null;
  dataRegions: DataRegion[];
  dataRegionsConfig: DataRegionsConfig | null;
  agentPlan: AgentPlan | null;
  agentSelection: AgentSelection | null;
  accessModel: AccessModel | null;
  accessConfig: AccessConfig | null;
  progress: OnboardingProgress;
  
  setCompany: (company: CompanyData) => void;
  setDataRegions: (regions: DataRegion[]) => void;
  setDataRegionsConfig: (config: DataRegionsConfig) => void;
  setAgentPlan: (plan: AgentPlan) => void;
  setAgentSelection: (selection: AgentSelection) => void;
  setAccessModel: (model: AccessModel) => void;
  setAccessConfig: (config: AccessConfig) => void;
  setProgress: (progress: OnboardingProgress) => void;
  saveProgress: () => void;
  reset: () => void;
}

const defaultState = {
  company: null,
  dataRegions: [],
  dataRegionsConfig: null,
  agentPlan: null,
  agentSelection: null,
  accessModel: null,
  accessConfig: null,
  progress: {
    currentStep: 0,
    completed: false,
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      setCompany: (company) => set({ company }),
      
      setDataRegions: (regions) => set({ dataRegions: regions }),
      
      setDataRegionsConfig: (config) => set({ dataRegionsConfig: config }),
      
      setAgentPlan: (plan) => set({ agentPlan: plan }),
      
      setAgentSelection: (selection) => set({ agentSelection: selection }),
      
      setAccessModel: (model) => set({ accessModel: model }),
      
      setAccessConfig: (config) => set({ accessConfig: config }),
      
      setProgress: (progress) => set({ progress }),
      
      saveProgress: () => {
        // Persistence handled by middleware
        set((state) => state);
      },
      
      reset: () => set(defaultState),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined)),
      partialize: (state) => ({
        company: state.company,
        dataRegions: state.dataRegions,
        dataRegionsConfig: state.dataRegionsConfig,
        agentPlan: state.agentPlan,
        agentSelection: state.agentSelection,
        accessModel: state.accessModel,
        accessConfig: state.accessConfig,
        progress: state.progress,
      }),
    }
  )
);

