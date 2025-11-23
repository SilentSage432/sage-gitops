'use client';

import { useOnboardingStore } from '@/lib/store/onboarding-store';

interface Step {
  id: number;
  label: string;
  path: string;
}

const steps: Step[] = [
  { id: 0, label: 'Company', path: '/wizard/company' },
  { id: 1, label: 'Data Regions', path: '/wizard/data' },
  { id: 2, label: 'Agent Plan', path: '/wizard/agents' },
  { id: 3, label: 'Access Model', path: '/wizard/access' },
  { id: 4, label: 'Review', path: '/wizard/review' },
];

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-[#111317] border border-white/10 p-6 mb-8 rounded-[14px]">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  index < currentStep
                    ? 'bg-[#10b981] text-white'
                    : index === currentStep
                    ? 'bg-[#6366f1] text-white border-2 border-[#6366f1]'
                    : 'bg-[#1a1d22] text-white/40 border border-white/10'
                }`}
              >
                {index < currentStep ? '✓' : step.id + 1}
              </div>
              <div
                className={`mt-2 text-xs font-medium text-center ${
                  index === currentStep ? 'text-[#6366f1]' : 'text-white/60'
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  index < currentStep ? 'bg-[#10b981]' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

