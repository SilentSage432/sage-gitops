'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OCTGuard } from '@/components/OCTGuard';

const sensitivityOptions = [
  { value: 'None', label: 'None' },
  { value: 'PCI', label: 'PCI' },
  { value: 'PHI / HIPAA', label: 'PHI / HIPAA' },
  { value: 'High Confidential', label: 'High Confidential' },
];

const regionOptions = [
  { id: 'us-east', name: 'US-East' },
  { id: 'us-west', name: 'US-West' },
  { id: 'eu', name: 'EU' },
  { id: 'apac', name: 'APAC' },
];

export default function DataRegionsPage() {
  const { dataRegionsConfig, setDataRegionsConfig } = useOnboardingStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    sensitivity: dataRegionsConfig?.sensitivity || 'None',
    selectedRegions: dataRegionsConfig?.selectedRegions || [],
    residencyRequired: dataRegionsConfig?.residencyRequired || false,
  });

  // Check if form is valid (at least one region must be selected)
  const isFormValid = formData.selectedRegions.length > 0;

  const handleSensitivityChange = (value: string) => {
    setFormData({ ...formData, sensitivity: value as any });
  };

  const toggleRegion = (regionId: string) => {
    setFormData((prev) => {
      const newRegions = prev.selectedRegions.includes(regionId)
        ? prev.selectedRegions.filter((id) => id !== regionId)
        : [...prev.selectedRegions, regionId];
      return { ...prev, selectedRegions: newRegions };
    });
  };

  const handleResidencyToggle = (checked: boolean) => {
    setFormData({ ...formData, residencyRequired: checked });
  };

  const handleBack = () => {
    router.push('/onboarding/company');
  };

  const handleNext = () => {
    if (isFormValid) {
      setDataRegionsConfig({
        sensitivity: formData.sensitivity as any,
        selectedRegions: formData.selectedRegions,
        residencyRequired: formData.residencyRequired,
      });
      router.push('/onboarding/agents');
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-8 fade-in">
            <div>
              <div className="bg-[#111317] border border-white/10 p-6 rounded-[14px]">
              <h2 className="text-xl font-medium mb-4 text-[#e2e6ee]">
                Data & Regions
              </h2>
              
              <div className="space-y-4">
                {/* Data Sensitivity */}
                <div className="space-y-3">
                  <Label>Data Sensitivity</Label>
                  <RadioGroup
                    options={sensitivityOptions}
                    value={formData.sensitivity}
                    onValueChange={handleSensitivityChange}
                  />
                </div>

                {/* Region Selection */}
                <div className="space-y-3">
                  <Label>
                    Region Selection <span className="text-red-400">*</span>
                  </Label>
                  <div className="space-y-3">
                    {regionOptions.map((region) => (
                      <label
                        key={region.id}
                        className={`flex items-center p-4 border border-white/10 rounded-[14px] cursor-pointer transition-colors ${
                          formData.selectedRegions.includes(region.id)
                            ? 'bg-[#1a1d22] border-[#6366f1]'
                            : 'bg-[#1a1d22] hover:bg-[#111317]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedRegions.includes(region.id)}
                          onChange={() => toggleRegion(region.id)}
                          className="w-5 h-5 text-[#6366f1] rounded focus:ring-[#6366f1] focus:ring-2 bg-[#0b0c0f] border-white/10"
                        />
                        <span className="ml-3 text-sm font-medium text-[#e2e6ee]">
                          {region.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.selectedRegions.length === 0 && (
                    <p className="text-sm text-red-400">
                      Please select at least one region
                    </p>
                  )}
                </div>

                {/* Data Residency Required */}
                <div className="flex items-center justify-between p-4 border border-white/10 rounded-[14px] bg-[#1a1d22]">
                  <div className="space-y-0.5">
                    <Label htmlFor="residency" className="text-base">
                      Data Residency Required?
                    </Label>
                    <p className="text-sm text-white/60">
                      Ensure data remains within selected regions
                    </p>
                  </div>
                  <Switch
                    id="residency"
                    checked={formData.residencyRequired}
                    onCheckedChange={handleResidencyToggle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-50 bg-[#111317]/80 backdrop-blur-md border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-white/60 hidden sm:block">
              Step 2
            </div>

            <Button
              onClick={handleNext}
              disabled={!isFormValid}
              className="w-full sm:w-auto px-6"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Next
            </Button>
          </div>
        </div>
      </div>
      </div>
    </OCTGuard>
  );
}
