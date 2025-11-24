import React from "react";

import { useStabilityForecast } from "../../sage/cognition/useStabilityForecast";

import { useKernelSignal } from "../../sage/kernel/useKernelSignal";

import { useMeshTelemetry } from "../../sage/telemetry/useMeshTelemetry";



export const FederationHealthMatrix: React.FC = () => {

  const forecast = useStabilityForecast() || { state: "stable" };

  const kernelWarning = useKernelSignal("kernel.warning");

  const kernelPulse = useKernelSignal("kernel.pulse");

  const telemetry = useMeshTelemetry();



  const latest = telemetry[telemetry.length - 1];



  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wide text-purple-300 mb-2">
          Federation Health Matrix
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 min-w-0">
          <div className="grid grid-cols-3 gap-4 min-w-0">
            {/* PI CLUSTER */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Pi Cluster</p>
              <p className="text-xl font-semibold text-purple-300 truncate">
                {latest ? "ONLINE" : "STANDBY"}
              </p>
            </div>

            {/* NODES */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Federation Nodes</p>
              <p className="text-xl font-semibold text-blue-300 truncate">
                {latest ? "DISCOVERED" : "NONE"}
              </p>
            </div>

            {/* KERNEL */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Kernel Status</p>
              <p className={`text-xl font-semibold truncate ${
                kernelWarning ? "text-red-400" : "text-green-300"
              }`}>
                {kernelWarning ? "WARN" : "STABLE"}
              </p>
            </div>

            {/* ARC SYSTEM */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Arc System</p>
              <p className="text-xl font-semibold text-yellow-300 truncate">
                READY
              </p>
            </div>

            {/* RHO² SECURITY */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Rho² Security</p>
              <p className="text-xl font-semibold text-cyan-300 truncate">
                SEALED
              </p>
            </div>

            {/* OVERALL HEALTH */}
            <div className="p-4 bg-slate-900/60 rounded border border-slate-800 min-w-0 overflow-hidden">
              <p className="text-sm text-slate-500 mb-1 truncate">Overall Health</p>
              <p className={`text-xl font-semibold truncate ${
                forecast.state === "stable"
                  ? "text-green-300"
                  : forecast.state === "uncertain"
                  ? "text-yellow-300"
                  : "text-red-400"
              }`}>
                {forecast.state.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};
