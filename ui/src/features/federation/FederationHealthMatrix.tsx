import React from "react";

import { useStabilityForecast } from "../../sage/cognition/useStabilityForecast";

import { useKernelSignal } from "../../sage/kernel/useKernelSignal";

import { useMeshTelemetry } from "../../sage/telemetry/useMeshTelemetry";



export const FederationHealthMatrix: React.FC = () => {

  const forecast = useStabilityForecast();

  const kernelWarning = useKernelSignal("kernel.warning");

  const kernelPulse = useKernelSignal("kernel.pulse");

  const telemetry = useMeshTelemetry();



  const latest = telemetry[telemetry.length - 1];



  return (

    <div className="p-6 space-y-6">

      <h2 className="text-2xl font-bold text-purple-300">

        Federation Health Matrix

      </h2>



      <div className="grid grid-cols-3 gap-6">

        {/* PI CLUSTER */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Pi Cluster</p>

          <p className="text-xl font-semibold text-purple-300">

            {latest ? "ONLINE" : "STANDBY"}

          </p>

        </div>



        {/* NODES */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Federation Nodes</p>

          <p className="text-xl font-semibold text-blue-300">

            {latest ? "DISCOVERED" : "NONE"}

          </p>

        </div>



        {/* KERNEL */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Kernel Status</p>

          <p

            className={`text-xl font-semibold ${

              kernelWarning ? "text-red-400" : "text-green-300"

            }`}

          >

            {kernelWarning ? "WARN" : "STABLE"}

          </p>

        </div>



        {/* ARC SYSTEM */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Arc System</p>

          <p className="text-xl font-semibold text-yellow-300">

            READY

          </p>

        </div>



        {/* RHO² SECURITY */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Rho² Security</p>

          <p className="text-xl font-semibold text-cyan-300">

            SEALED

          </p>

        </div>



        {/* OVERALL HEALTH */}

        <div className="p-4 bg-slate-900/60 rounded border border-slate-800">

          <p className="text-sm text-slate-500 mb-1">Overall Health</p>

          <p

            className={`text-xl font-semibold ${

              forecast.state === "stable"

                ? "text-green-300"

                : forecast.state === "uncertain"

                ? "text-yellow-300"

                : "text-red-400"

            }`}

          >

            {forecast.state.toUpperCase()}

          </p>

        </div>

      </div>

    </div>

  );

};
