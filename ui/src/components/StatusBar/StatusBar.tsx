import React from 'react';
import { FederationPulseOrb } from "../FederationPulseOrb/FederationPulseOrb";
import "../FederationPulseOrb/FederationPulseOrb.css";

/**
 * StatusBar – Bottom status line showing GitOps, node health, epoch, time
 */
export const StatusBar: React.FC = () => {
  return (
    <div className="w-full h-full border-t border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between px-6 text-xs">
      <div className="flex items-center gap-4 text-slate-400">
        {/* Federation Heartbeat Orb */}
        <FederationPulseOrb />
        <span>SAGE Federation — Online</span>
      </div>
    </div>
  );
};

