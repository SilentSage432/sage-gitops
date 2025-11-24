'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore, Agent } from '@/lib/store/onboarding-store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { OCTGuard } from '@/components/OCTGuard';

const availableAgents: Agent[] = [
  {
    id: 'researcher',
    name: 'Researcher Agent',
    description: 'Data gathering + external retrieval',
  },
  {
    id: 'audit-logger',
    name: 'Audit Logger',
    description: 'Immutable compliance logging',
  },
  {
    id: 'etl-lite',
    name: 'ETL-Lite',
    description: 'Basic data processing and ingestion',
  },
  {
    id: 'notification-relay',
    name: 'Notification Relay',
    description: 'Alerts + async messaging',
  },
  {
    id: 'observer',
    name: 'Observer Agent',
    description: 'Passive telemetry + drift detection',
  },
];

export default function AgentsPage() {
  const { agentSelection, setAgentSelection } = useOnboardingStore();
  const router = useRouter();
  
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    agentSelection?.selectedAgents || []
  );

  // Check if form is valid (at least one agent must be selected)
  const isFormValid = selectedAgents.length > 0;

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/data-regions');
  };

  const handleNext = () => {
    if (isFormValid) {
      setAgentSelection({
        selectedAgents,
      });
      router.push('/onboarding/access');
    }
  };

  return (
    <OCTGuard>
      <div className="min-h-[100svh] flex flex-col bg-[#0b0c0f] text-white">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain pt-safe pb-safe px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-8 fade-in">
            <div>
              <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-tight text-[#e2e6ee]">
                Agent Selection
              </h2>
              <p className="text-sm text-white/60 mt-2">
                Select the agents you want to enable for your organization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableAgents.map((agent, index) => {
                const isSelected = selectedAgents.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                  >
                    <Card
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#6366f1] bg-[#1a1d22] shadow-lg shadow-[#6366f1]/20'
                          : 'hover:border-white/20 hover:bg-[#111317]'
                      }`}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{agent.name}</CardTitle>
                            <CardDescription className="mt-2">
                              {agent.description}
                            </CardDescription>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleAgent(agent.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-4 mt-1"
                          />
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                );
              })}
            </div>

            {selectedAgents.length === 0 && (
              <div className="mt-6 p-4 bg-[#1a1d22] border border-red-400/30 rounded-[14px]">
                <p className="text-sm text-red-400">
                  Please select at least one agent to continue
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-50 bg-[#111317]/80 backdrop-blur-md border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-white/60 hidden sm:block">
              Step 3
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
