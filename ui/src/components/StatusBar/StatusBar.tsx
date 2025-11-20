import React, { useMemo } from 'react';
import { FederationPulseOrb } from "../FederationPulseOrb/FederationPulseOrb";
import "../FederationPulseOrb/FederationPulseOrb.css";
import { usePulseStore } from "../../sage/state/pulseStore";

/**
 * StatusBar – Bottom status line showing GitOps, node health, epoch, time
 */
export const StatusBar: React.FC = () => {
  const pulses = usePulseStore((s) => s.pulses);

  const lastHeartbeat = useMemo(() => {
    return [...pulses]
      .reverse()
      .find((p) => p.signal === "HEARTBEAT_TICK");
  }, [pulses]);

  return (
    <div className="w-full h-full border-t border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between px-6 text-xs">
      <div className="flex items-center gap-4 text-slate-400">
        {/* Federation Heartbeat Orb */}
        <FederationPulseOrb />
        <span>SAGE Federation — Online</span>
      </div>
      <div className="text-slate-500 font-mono">
        HB:{" "}
        {lastHeartbeat
          ? new Date(lastHeartbeat.timestamp).toLocaleTimeString()
          : "—"}
      </div>
    </div>
  );
};

