import React from "react";

export interface PiThermalMetrics {
  tempC: number;
  powerW: number;
  clockMHz: number;
  voltage: number;
  throttled: boolean;
}

interface PiThermalOverlayProps {
  metrics: PiThermalMetrics | null;
}

export const PiThermalOverlay: React.FC<PiThermalOverlayProps> = ({ metrics }) => {
  // Skeleton shimmer for loading state
  if (!metrics) {
    return (
      <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
        <div className="space-y-4">
          <div className="h-12 bg-slate-800/60 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-8 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-8 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-8 bg-slate-800/60 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Determine temperature color based on thresholds
  const getTempColor = (temp: number): string => {
    if (temp < 60) return "text-blue-300";
    if (temp >= 60 && temp <= 75) return "text-amber-400";
    return "text-red-500 animate-pulse";
  };

  const tempColor = getTempColor(metrics.tempC);

  return (
    <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden transition-all duration-300">
      {/* Header with throttled badge */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">Power & Thermal</p>
        {metrics.throttled && (
          <span className="px-2 py-1 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/30 rounded uppercase">
            Throttled
          </span>
        )}
      </div>

      {/* Main temperature display - large and prominent */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <p className={`text-4xl font-bold font-mono ${tempColor} transition-colors duration-300`}>
            {metrics.tempC.toFixed(1)}
          </p>
          <p className="text-xl text-slate-400">°C</p>
        </div>
      </div>

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Power readout */}
        <div className="p-2 bg-slate-800/40 rounded border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1 truncate">Power</p>
          <p className="text-sm font-mono text-purple-300 truncate">
            {metrics.powerW.toFixed(1)}W
          </p>
        </div>

        {/* Clock frequency */}
        <div className="p-2 bg-slate-800/40 rounded border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1 truncate">Clock</p>
          <p className="text-sm font-mono text-cyan-300 truncate">
            {metrics.clockMHz.toFixed(0)}MHz
          </p>
        </div>

        {/* Voltage */}
        <div className="p-2 bg-slate-800/40 rounded border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1 truncate">Voltage</p>
          <p className="text-sm font-mono text-green-300 truncate">
            {metrics.voltage.toFixed(2)}V
          </p>
        </div>
      </div>
    </div>
  );
};

