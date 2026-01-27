import React from 'react';

/**
 * ArcZetaPanel – Zeta Arc Chamber (observation mode)
 */
export const ArcZetaPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Ζ Zeta Arc
        </h2>
        <p className="text-sm text-slate-400">
          Zeta Arc Chamber (observation mode)
        </p>
      </div>
      <div className="mt-8 p-6 bg-slate-900/50 rounded border border-slate-800">
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">
            OBSERVATION MODE
          </p>
          <p className="text-slate-600 text-xs">
            Read-only display shell
          </p>
        </div>
      </div>
    </div>
  );
};
