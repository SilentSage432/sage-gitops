'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { WizardStepper } from '@/components/WizardStepper';
import { WizardActions } from '@/components/WizardActions';
import { useOnboardingStore, DataRegion } from '@/lib/store/onboarding-store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const availableRegions: DataRegion[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', selected: false },
  { id: 'us-west-2', name: 'US West (Oregon)', selected: false },
  { id: 'eu-west-1', name: 'Europe (Ireland)', selected: false },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', selected: false },
];

export default function DataPage() {
  const { dataRegions, setDataRegions } = useOnboardingStore();
  const router = useRouter();
  const [selectedRegions, setSelectedRegions] = useState<DataRegion[]>(
    dataRegions.length > 0 ? dataRegions : availableRegions
  );

  useEffect(() => {
    if (dataRegions.length > 0) {
      setSelectedRegions(dataRegions);
    }
  }, [dataRegions]);

  const toggleRegion = (id: string) => {
    setSelectedRegions((prev) =>
      prev.map((region) =>
        region.id === id ? { ...region, selected: !region.selected } : region
      )
    );
  };

  const canProceed = selectedRegions.some((r) => r.selected);

  const handleNext = () => {
    setDataRegions(selectedRegions);
    router.push('/wizard/agents');
  };

  return (
    <OCTGuard>
      <div className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={1} />
          
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold mb-6">Data Regions</h2>
            <p className="text-gray-600 mb-6">Select one or more regions where your data will be stored and processed.</p>
            
            <div className="space-y-3">
              {selectedRegions.map((region) => (
                <label
                  key={region.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={region.selected}
                    onChange={() => toggleRegion(region.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium">{region.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{region.id}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <WizardActions currentStep={1} onNext={handleNext} canProceed={canProceed} />
      </div>
    </OCTGuard>
  );
}

