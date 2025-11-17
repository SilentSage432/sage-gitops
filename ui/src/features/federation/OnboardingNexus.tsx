import React from 'react';

/**
 * OnboardingNexus – Tenant onboarding view shell
 */
export const OnboardingNexus: React.FC = () => {
  const mockTenants = [
    { id: 't-1', name: 'Tenant Alpha', status: 'active', created: '2025-01-10' },
    { id: 't-2', name: 'Tenant Beta', status: 'pending', created: '2025-01-15' },
    { id: 't-3', name: 'Tenant Gamma', status: 'active', created: '2025-01-12' },
    { id: 't-4', name: 'Tenant Delta', status: 'provisioning', created: '2025-01-14' }
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/30 text-green-400';
      case 'pending':
        return 'bg-yellow-600/30 text-yellow-400';
      case 'provisioning':
        return 'bg-blue-600/30 text-blue-400';
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
        <div className="space-y-2">
          {mockTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-medium">
                    {tenant.name}
                  </span>
                  <span className="ml-3 text-xs text-slate-500">
                    Created: {tenant.created}
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
      </div>
    </div>
  );
};

