import React, { useEffect, useState } from 'react';
import { getArcStatus, ArcStatus } from '../../services/arcService';

/**
 * ArcLambdaPanel – Lambda Arc Chamber (shell)
 */
export const ArcLambdaPanel: React.FC = () => {
  const [arcData, setArcData] = useState<ArcStatus | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getArcStatus('lambda');
      setArcData(data);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          Λ Lambda Arc
        </h2>
        <p className="text-sm text-slate-400">
          Lambda Arc Chamber (shell)
        </p>
      </div>
      <div className="mt-8 p-6 bg-slate-900/50 rounded border border-slate-800">
        {arcData ? (
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-500">Status:</span> {arcData.status}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Signals:</span> {arcData.signals}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Warnings:</span> {arcData.warnings}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Last Update:</span> {new Date(arcData.lastUpdate).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
};

