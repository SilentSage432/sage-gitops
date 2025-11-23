'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { WizardStepper } from '@/components/WizardStepper';
import { WizardActions } from '@/components/WizardActions';
import { useOnboardingStore, AccessModel } from '@/lib/store/onboarding-store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const models = [
  { id: 'rbac' as const, name: 'Role-Based Access Control (RBAC)', description: 'Access based on user roles' },
  { id: 'abac' as const, name: 'Attribute-Based Access Control (ABAC)', description: 'Access based on user attributes and context' },
  { id: 'hybrid' as const, name: 'Hybrid (RBAC + ABAC)', description: 'Combination of role and attribute-based access' },
];

export default function AccessPage() {
  const { accessModel, setAccessModel } = useOnboardingStore();
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<AccessModel['model']>(accessModel?.model || null);
  const [description, setDescription] = useState<string>(accessModel?.description || '');

  const canProceed = selectedModel !== null;

  const handleNext = () => {
    if (selectedModel) {
      setAccessModel({
        model: selectedModel,
        description,
      });
      router.push('/wizard/review');
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={3} />
          
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold mb-6">Access Model</h2>
            <p className="text-gray-600 mb-6">Choose your access control model.</p>
            
            <div className="space-y-4 mb-6">
              {models.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedModel === model.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessModel"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => {
                      setSelectedModel(model.id);
                      setDescription(model.description);
                    }}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold">{model.name}</div>
                    <div className="text-sm text-gray-600">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {selectedModel && (
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any specific access control requirements..."
                />
              </div>
            )}
          </div>
        </div>

        <WizardActions currentStep={3} onNext={handleNext} canProceed={canProceed} />
      </div>
    </OCTGuard>
  );
}

