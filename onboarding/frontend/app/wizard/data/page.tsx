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
      <div className="min-h-screen bg-[#0b0c0f] text-white p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={1} />
          
          <div className="bg-[#111317] border border-white/10 p-8 rounded-[14px]">
            <h2 className="text-2xl font-semibold mb-6 text-[#e2e6ee]">Data Regions</h2>
            <p className="text-white/60 mb-6">Select one or more regions where your data will be stored and processed.</p>
            
            <div className="space-y-3">
              {selectedRegions.map((region) => (
                <label
                  key={region.id}
                  className={`flex items-center p-4 border border-white/10 rounded-[14px] cursor-pointer transition-colors ${
                    region.selected ? 'bg-[#1a1d22] border-[#6366f1]' : 'bg-[#1a1d22] hover:bg-[#111317]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={region.selected}
                    onChange={() => toggleRegion(region.id)}
                    className="w-5 h-5 text-[#6366f1] rounded focus:ring-[#6366f1] bg-[#0b0c0f] border-white/10"
                  />
                  <span className="ml-3 text-sm font-medium text-[#e2e6ee]">{region.name}</span>
                  <span className="ml-auto text-xs text-white/40">{region.id}</span>
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
