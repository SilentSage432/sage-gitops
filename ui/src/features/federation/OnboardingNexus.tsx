import React, { useEffect, useState } from 'react';
import { getTenants, Tenant } from '../../services/federationService';
import { SimulationView } from '../../components/SimulationView';
import { SimulationPanel } from '../../components/SimulationPanel';
import { SimulationDiffView } from '../../components/SimulationDiffView';

/**
 * OnboardingNexus – Tenant onboarding view shell
 */
export const OnboardingNexus: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [diffResult, setDiffResult] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getTenants();
      setTenants(data);
    };
    loadData();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/30 text-green-400';
      case 'pending':
        return 'bg-yellow-600/30 text-yellow-400';
      case 'suspended':
        return 'bg-red-600/30 text-red-400';
      case 'inactive':
        return 'bg-slate-700 text-slate-400';
      default:
        return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Onboarding Nexus
        </h2>
        <p className="text-sm text-slate-400">
          Tenant onboarding view shell
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Tenant Registry
        </h3>
        {tenants.length > 0 ? (
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-medium">
                      {tenant.id}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColor(tenant.status)}`}
                  >
                    {tenant.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Loading...</p>
        )}
      </div>

      <SimulationView data={simulationResult} />
      <SimulationPanel simulation={simulationResult} />
      <SimulationDiffView diff={diffResult} />
    </div>
  );
};

