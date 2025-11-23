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
    <div className="fixed bottom-0 left-0 right-0 glass p-4 border-t border-white/20">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={isFirstStep}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        
        <div className="text-sm text-gray-600">
          Step {currentStep + 1} of {stepPaths.length}
        </div>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Onboarding
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

