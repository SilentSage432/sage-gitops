// 🔴 Topology Pulse Indicator
// Visual pulse indicator reflecting topology status

import React from 'react';

export type TopologyPulseStatus = 'LIVE' | 'DEGRADED' | 'BROKEN' | 'OFFLINE';

interface TopologyPulseProps {
  status: TopologyPulseStatus;
  className?: string;
}

export const TopologyPulse: React.FC<TopologyPulseProps> = ({ status, className = '' }) => {
  const getPulseStyles = () => {
    switch (status) {
      case 'LIVE':
        return {
          base: 'bg-green-400',
          pulse: 'bg-green-500',
          glow: 'shadow-green-500/50',
        };
      case 'DEGRADED':
        return {
          base: 'bg-amber-400',
          pulse: 'bg-amber-500',
          glow: 'shadow-amber-500/50',
        };
      case 'BROKEN':
        return {
          base: 'bg-red-400',
          pulse: 'bg-red-500',
          glow: 'shadow-red-500/50',
        };
      case 'OFFLINE':
        return {
          base: 'bg-slate-500',
          pulse: 'bg-slate-600',
          glow: '',
        };
      default:
        return {
          base: 'bg-slate-500',
          pulse: 'bg-slate-600',
          glow: '',
        };
    }
  };

  const styles = getPulseStyles();
  const shouldPulse = status === 'LIVE' || status === 'DEGRADED' || status === 'BROKEN';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className={`relative w-2 h-2 rounded-full ${styles.base} ${shouldPulse ? 'animate-pulse' : ''}`}>
        {shouldPulse && (
          <div className={`absolute inset-0 rounded-full ${styles.pulse} ${styles.glow} animate-ping opacity-75`} />
        )}
      </div>
    </div>
  );
};

