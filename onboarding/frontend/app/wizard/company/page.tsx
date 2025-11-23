'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { WizardStepper } from '@/components/WizardStepper';
import { WizardActions } from '@/components/WizardActions';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyPage() {
  const { company, setCompany } = useOnboardingStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    domain: company?.domain || '',
    region: company?.region || '',
  });

  const canProceed = formData.name.length > 0 && formData.domain.length > 0 && formData.region.length > 0;

  const handleNext = () => {
    setCompany({
      name: formData.name,
      domain: formData.domain,
      region: formData.region,
    });
    router.push('/wizard/data');
  };

  return (
    <OCTGuard>
      <div className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={0} />
          
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold mb-6">Company Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Primary Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <WizardActions currentStep={0} onNext={handleNext} canProceed={canProceed} />
      </div>
    </OCTGuard>
  );
}

