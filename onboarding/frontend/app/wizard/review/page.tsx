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
      <div className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={4} />
          
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold mb-6">Review Your Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Company Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Name:</span> {company.name}</p>
                  <p><span className="font-medium">Domain:</span> {company.domain}</p>
                  <p><span className="font-medium">Region:</span> {company.region}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Regions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {dataRegions.filter((r) => r.selected).length > 0 ? (
                    <ul className="list-disc list-inside">
                      {dataRegions.filter((r) => r.selected).map((region) => (
                        <li key={region.id}>{region.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No regions selected</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Agent Plan</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Plan:</span> {agentPlan.plan}</p>
                  <p><span className="font-medium">Agent Count:</span> {agentPlan.agentCount}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Access Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="font-medium">Model:</span> {accessModel.model}</p>
                  {accessModel.description && (
                    <p className="mt-1">{accessModel.description}</p>
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
