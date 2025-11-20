import React from 'react';
import { FederationPulseOrb } from "../FederationPulseOrb/FederationPulseOrb";
import "../FederationPulseOrb/FederationPulseOrb.css";

/**
 * StatusBar – Bottom status line showing GitOps, node health, epoch, time
 */
export const StatusBar: React.FC = () => {
  const now = new Date();
  const timeString = now.toISOString().substr(11, 8) + 'Z';

  return (
    <div className="w-full h-full border-t border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between px-6 text-xs">
      <div className="flex items-center gap-4 text-slate-400">
        {/* Federation Heartbeat Orb */}
        <FederationPulseOrb />
        <span>
          GitOps: <span className="text-green-400 font-medium">Synced</span>
        </span>
        <span>·</span>
        <span>
          Node: <span className="text-green-400 font-medium">Healthy</span>
        </span>
        <span>·</span>
        <span>
          Epoch: <span className="text-slate-200 font-mono">1127</span>
        </span>
      </div>
      <div className="text-slate-500 font-mono">
        Time: <span className="text-slate-300">{timeString}</span>
      </div>
    </div>
  );
};

