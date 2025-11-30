import React, { useState, useEffect } from "react";
import { exportFederationEnvelope } from "../federation/token";
import { SimulationPanel } from "../components/SimulationPanel";
import { ApprovalPanel } from "../components/ApprovalPanel";
import { fetchPendingIntents } from "../lib/api/intent";
import { CapabilityGraph } from "../components/CapabilityGraph";
import { ExecutionCandidateView } from "../components/ExecutionCandidateView";
import { RiskView } from "../components/RiskView";

const OnboardingNexusPanel: React.FC = () => {
  const [simulation, setSimulation] = useState<any>(null);
  const [params, setParams] = useState<any>({});
  const [pendingIntents, setPendingIntents] = useState<any[]>([]);
  const [capGraph, setCapGraph] = useState<any[] | null>(null);
  const [candidates, setCandidates] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    const loadIntents = async () => {
      try {
        const intents = await fetchPendingIntents();
        setPendingIntents(intents);
      } catch (error) {
        console.error("Failed to fetch pending intents:", error);
      }
    };
    
    const loadCapGraph = async () => {
      try {
        const response = await fetch("/api/capabilities");
        const data = await response.json();
        setCapGraph(data.graph || null);
      } catch (error) {
        console.error("Failed to fetch capability graph:", error);
      }
    };
    
    const loadCandidates = async () => {
      try {
        const response = await fetch("/api/execution/candidates?action=get-status");
        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error("Failed to fetch execution candidates:", error);
      }
    };
    
    const loadRisk = async () => {
      try {
        const response = await fetch("/api/execution/risk?action=get-status");
        const data = await response.json();
        setRisk(data);
      } catch (error) {
        console.error("Failed to fetch risk score:", error);
      }
    };
    
    loadIntents();
    loadCapGraph();
    loadCandidates();
    loadRisk();
    const interval = setInterval(() => {
      loadIntents();
      loadCapGraph();
      loadCandidates();
      loadRisk();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "get-status",
          payload: {},
          role: "sovereign",
          options: params,
        }),
      });
      const data = await response.json();
      setSimulation(data.simulation);
    } catch (error) {
      console.error("Simulation error:", error);
    }
  };
  const handleLaunch = () => {
    const env = exportFederationEnvelope();
    if (env) {
      const encoded = encodeURIComponent(JSON.stringify(env));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("federationEnvelope", JSON.stringify(env));
      }
      window.open(`https://localhost:3000/onboarding?token=${encoded}`, "_blank", "noreferrer");
    } else {
      window.open("https://localhost:3000/onboarding", "_blank", "noreferrer");
    }
  };

  return (
    <div className="p-6 space-y-5 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bridge Alignment</p>
        <h2 className="text-2xl font-semibold text-white">Onboarding Nexus</h2>
        <p className="text-slate-400">
          Launch the dedicated onboarding stack to connect new operators into the Federation lattice.
        </p>
      </header>

      <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-4 text-slate-300">
        The onboarding nexus mirrors the production onboarding flow and initializes PRIME-mode credentials.
      </div>

      <button
        onClick={handleLaunch}
        className="w-full rounded-md border border-purple-500/40 bg-purple-500/20 px-4 py-3 text-sm font-semibold text-purple-100 hover:bg-purple-500/30 transition"
      >
        Launch Onboarding System
      </button>

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Simulation Parameters</h3>
          <div className="space-y-3">
            <textarea
              value={JSON.stringify(params, null, 2)}
              onChange={(e) => {
                try {
                  setParams(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='{\n  "unreachableAgents": [],\n  "roleOverride": null\n}'
              className="w-full rounded bg-slate-900/50 border border-slate-700 px-3 py-2 text-xs text-slate-300 font-mono"
              rows={6}
            />
            <button
              onClick={handleSimulate}
              className="w-full rounded-md border border-blue-500/40 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/30 transition"
            >
              Simulate With Parameters
            </button>
          </div>
        </div>

        <SimulationPanel simulation={simulation} />
      </div>

      <ApprovalPanel intents={pendingIntents} />
      
      <CapabilityGraph graph={capGraph || undefined} />
      
      <ExecutionCandidateView result={candidates} />
      
      <RiskView risk={risk} />
    </div>
  );
};

export default OnboardingNexusPanel;

