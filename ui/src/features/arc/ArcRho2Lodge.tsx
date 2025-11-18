import React, { useEffect, useState } from 'react';
import { getEpochStream, EpochStream } from '../../services/rho2Service';

/**
 * ArcRho2Lodge – Rho² Cosmic Lodge shell
 */
export const ArcRho2Lodge: React.FC = () => {
  const [epochData, setEpochData] = useState<EpochStream | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getEpochStream();
      setEpochData(data);
    };
    loadData();
  }, []);

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
          Epoch Stream
        </h3>
        {epochData ? (
          <div className="p-4 bg-slate-900/50 rounded border border-slate-800 space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-500">Current Epoch:</span> {epochData.currentEpoch}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Fingerprint:</span> {epochData.fingerprint}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Participants:</span> {epochData.participants}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Integrity:</span> {epochData.integrity}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Next Epoch ETA:</span> {epochData.nextEpochEtaSeconds}s
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
};

