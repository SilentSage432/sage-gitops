import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export interface AgentPlan {
  plan: 'starter' | 'growth' | 'enterprise' | null;
  agentCount: number;
}

export interface AccessModel {
  model: 'rbac' | 'abac' | 'hybrid' | null;
  description: string;
}

export interface OnboardingProgress {
  currentStep: number;
  completed: boolean;
}

interface OnboardingState {
  company: CompanyData | null;
  dataRegions: DataRegion[];
  agentPlan: AgentPlan | null;
  accessModel: AccessModel | null;
  progress: OnboardingProgress;
  
  setCompany: (company: CompanyData) => void;
  setDataRegions: (regions: DataRegion[]) => void;
  setAgentPlan: (plan: AgentPlan) => void;
  setAccessModel: (model: AccessModel) => void;
  setProgress: (progress: OnboardingProgress) => void;
  saveProgress: () => void;
  reset: () => void;
}

const defaultState = {
  company: null,
  dataRegions: [],
  agentPlan: null,
  accessModel: null,
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
      
      setAgentPlan: (plan) => set({ agentPlan: plan }),
      
      setAccessModel: (model) => set({ accessModel: model }),
      
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
        agentPlan: state.agentPlan,
        accessModel: state.accessModel,
        progress: state.progress,
      }),
    }
  )
);

