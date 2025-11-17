import React from 'react';

/**
 * ArcRho2Lodge – Rho² Cosmic Lodge shell
 */
export const ArcRho2Lodge: React.FC = () => {
  const mockEpochs = [
    { id: '1127', timestamp: '2025-01-15T21:14:00Z', status: 'active' },
    { id: '1126', timestamp: '2025-01-15T20:00:00Z', status: 'completed' },
    { id: '1125', timestamp: '2025-01-15T19:00:00Z', status: 'completed' },
    { id: '1124', timestamp: '2025-01-15T18:00:00Z', status: 'completed' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Rho² Cosmic Lodge
        </h2>
        <p className="text-sm text-slate-400">
          Cosmic Lodge shell
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Epoch History
        </h3>
        <div className="space-y-2">
          {mockEpochs.map((epoch) => (
            <div
              key={epoch.id}
              className="p-4 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-purple-400 font-mono font-semibold">
                    Epoch {epoch.id}
                  </span>
                  <span className="ml-3 text-xs text-slate-500">
                    {epoch.timestamp}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    epoch.status === 'active'
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {epoch.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

