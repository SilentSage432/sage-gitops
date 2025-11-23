'use client';

import { OCTGuard } from '@/components/OCTGuard';
import { WizardStepper } from '@/components/WizardStepper';
import { WizardActions } from '@/components/WizardActions';
import { useOnboardingStore, AgentPlan } from '@/lib/store/onboarding-store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const plans = [
  { id: 'starter' as const, name: 'Starter', agents: 10, price: '$99/month' },
  { id: 'growth' as const, name: 'Growth', agents: 50, price: '$499/month' },
  { id: 'enterprise' as const, name: 'Enterprise', agents: 200, price: 'Custom' },
];

export default function AgentsPage() {
  const { agentPlan, setAgentPlan } = useOnboardingStore();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<AgentPlan['plan']>(agentPlan?.plan || null);
  const [agentCount, setAgentCount] = useState<number>(agentPlan?.agentCount || 0);

  const canProceed = selectedPlan !== null && agentCount > 0;

  const handleNext = () => {
    if (selectedPlan) {
      setAgentPlan({
        plan: selectedPlan,
        agentCount,
      });
      router.push('/wizard/access');
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <WizardStepper currentStep={2} />
          
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold mb-6">Agent Plan</h2>
            <p className="text-gray-600 mb-6">Choose your agent plan and specify the number of agents.</p>
            
            <div className="space-y-4 mb-6">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold">{plan.name}</div>
                    <div className="text-sm text-gray-600">
                      Up to {plan.agents} agents · {plan.price}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {selectedPlan && (
              <div>
                <label className="block text-sm font-medium mb-2">Number of Agents</label>
                <input
                  type="number"
                  min="1"
                  max={plans.find((p) => p.id === selectedPlan)?.agents || 200}
                  value={agentCount}
                  onChange={(e) => setAgentCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum {plans.find((p) => p.id === selectedPlan)?.agents} agents for {plans.find((p) => p.id === selectedPlan)?.name} plan
                </p>
              </div>
            )}
          </div>
        </div>

        <WizardActions currentStep={2} onNext={handleNext} canProceed={canProceed} />
      </div>
    </OCTGuard>
  );
}

