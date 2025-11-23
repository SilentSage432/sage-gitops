'use client';

import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

interface WizardActionsProps {
  currentStep: number;
  onNext?: () => void;
  onBack?: () => void;
  onSubmit?: () => void;
  canProceed?: boolean;
}

const stepPaths = [
  '/wizard/company',
  '/wizard/data',
  '/wizard/agents',
  '/wizard/access',
  '/wizard/review',
];

export function WizardActions({ currentStep, onNext, onBack, onSubmit, canProceed = true }: WizardActionsProps) {
  const router = useRouter();
  const isLastStep = currentStep === stepPaths.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (!isLastStep) {
      router.push(stepPaths[currentStep + 1]);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (!isFirstStep) {
      router.push(stepPaths[currentStep - 1]);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      router.push('/wizard/complete');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111317] border-t border-white/10 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={isFirstStep}
          className="px-6 py-2 bg-[#1a1d22] text-white/60 hover:text-white border border-white/10 rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        
        <div className="text-sm text-white/60">
          Step {currentStep + 1} of {stepPaths.length}
        </div>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            className="px-6 py-2 bg-[#6366f1] text-white rounded-[14px] hover:bg-[#585ae8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Onboarding
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="px-6 py-2 bg-[#6366f1] text-white rounded-[14px] hover:bg-[#585ae8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

