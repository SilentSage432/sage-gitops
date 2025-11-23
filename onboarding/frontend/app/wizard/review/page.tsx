'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { WizardStepper } from '@/components/WizardStepper';
import { WizardActions } from '@/components/WizardActions';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function ReviewPage() {
  const { company, dataRegions, agentPlan, accessModel } = useOnboardingStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('oct-storage');
      if (!token) {
        throw new Error('No access token available');
      }

      const octData = JSON.parse(token);
      
      await axios.post(
        `${API_BASE_URL}/tenants`,
        {
          company,
          dataRegions: dataRegions.filter((r) => r.selected),
          agentPlan,
          accessModel,
        },
        {
          headers: {
            Authorization: `Bearer ${octData.token}`,
          },
        }
      );

      useOnboardingStore.getState().setProgress({ currentStep: 4, completed: true });
      router.push('/wizard/complete');
    } catch (error: any) {
      console.error('Submission error:', error);
      alert('Failed to submit onboarding data: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!company || !agentPlan || !accessModel) {
      router.push('/wizard/company');
    }
  }, [company, agentPlan, accessModel, router]);

  if (!company || !agentPlan || !accessModel) {
    return null;
  }

  return (
    <OCTGuard>
      <div className="min-h-screen bg-[#0b0c0f] text-white p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={4} />
          
          <div className="bg-[#111317] border border-white/10 p-8 rounded-[14px]">
            <h2 className="text-2xl font-semibold mb-6 text-[#e2e6ee]">Review Your Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-[#e2e6ee]">Company Information</h3>
                <div className="bg-[#1a1d22] p-4 rounded-[14px] border border-white/10">
                  <p className="text-white/80"><span className="font-medium">Name:</span> {company.name}</p>
                  <p className="text-white/80"><span className="font-medium">Domain:</span> {company.domain}</p>
                  <p className="text-white/80"><span className="font-medium">Region:</span> {company.region}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-[#e2e6ee]">Data Regions</h3>
                <div className="bg-[#1a1d22] p-4 rounded-[14px] border border-white/10">
                  {dataRegions.filter((r) => r.selected).length > 0 ? (
                    <ul className="list-disc list-inside text-white/80">
                      {dataRegions.filter((r) => r.selected).map((region) => (
                        <li key={region.id}>{region.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/60">No regions selected</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-[#e2e6ee]">Agent Plan</h3>
                <div className="bg-[#1a1d22] p-4 rounded-[14px] border border-white/10">
                  <p className="text-white/80"><span className="font-medium">Plan:</span> {agentPlan.plan}</p>
                  <p className="text-white/80"><span className="font-medium">Agent Count:</span> {agentPlan.agentCount}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-[#e2e6ee]">Access Model</h3>
                <div className="bg-[#1a1d22] p-4 rounded-[14px] border border-white/10">
                  <p className="text-white/80"><span className="font-medium">Model:</span> {accessModel.model}</p>
                  {accessModel.description && (
                    <p className="mt-1 text-white/80">{accessModel.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <WizardActions 
          currentStep={4} 
          onSubmit={handleSubmit} 
          canProceed={!submitting}
        />
      </div>
    </OCTGuard>
  );
}
