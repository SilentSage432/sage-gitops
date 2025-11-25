import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Cog, Shield, Brain, Eye, FileCode, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { genesisOrchestrator } from "./orchestrator/GenesisOrchestrator";
import { AgentManifest } from "./types/agentManifest";

const agentClasses = [
  { id: "researcher", label: "Researcher", icon: Brain },
  { id: "watcher", label: "Watcher", icon: Eye },
  { id: "analyst", label: "Analyst", icon: Cog },
  { id: "sentinel", label: "Sentinel", icon: Shield },
  { id: "auditor", label: "Auditor", icon: FileCode },
  { id: "custom", label: "Custom", icon: Sparkles }
];

const capabilities = [
  "ingest",
  "analyze",
  "classify",
  "respond",
  "monitor",
  "enforce",
  "stream",
  "predict",
];

export const AgentGenesis: React.FC = () => {
  const [agentName, setAgentName] = useState("");
  const [agentClass, setAgentClass] = useState("researcher");
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  
  // Genesis workflow state
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [genesisStatus, setGenesisStatus] = useState<string | null>(null);
  const [genesisProgress, setGenesisProgress] = useState<number | null>(null);
  const [genesisMessage, setGenesisMessage] = useState<string | null>(null);
  const [genesisId, setGenesisId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const toggleCap = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  // Preview manifest text
  const manifest: AgentManifest = {
    name: agentName || "unnamed_agent",
    class: agentClass,
    capabilities: selectedCaps,
    version: 1,
    mode: "active",
  };

  // Subscribe to genesis events
  useEffect(() => {
    const unsubscribeStarted = genesisOrchestrator.on("genesis.started", ({ data }) => {
      setIsLoading(true);
      setValidationErrors([]);
      setGenesisStatus("Validating manifest...");
      setGenesisProgress(null);
      setGenesisMessage("Starting genesis workflow...");
      setIsComplete(false);
      setIsFailed(false);
    });

    const unsubscribeProgress = genesisOrchestrator.on("genesis.progress", ({ data }) => {
      setGenesisStatus(data.stateLabel || data.status || "Processing...");
      setGenesisProgress(data.progress || null);
      setGenesisMessage(data.message || null);
      setGenesisId(data.genesisId || null);
    });

    const unsubscribeCompleted = genesisOrchestrator.on("genesis.completed", ({ data }) => {
      setIsLoading(false);
      setGenesisStatus("Completed");
      setGenesisProgress(100);
      setGenesisMessage(`Agent ${data.agentId} successfully forged!`);
      setIsComplete(true);
      setIsFailed(false);
    });

    const unsubscribeFailed = genesisOrchestrator.on("genesis.failed", ({ data }) => {
      setIsLoading(false);
      setGenesisStatus("Failed");
      setGenesisProgress(null);
      setGenesisMessage(data.error || "Genesis workflow failed");
      setValidationErrors(data.errors || []);
      setIsComplete(false);
      setIsFailed(true);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, []);

  const handleForge = async () => {
    // Reset state
    setValidationErrors([]);
    setGenesisStatus(null);
    setGenesisProgress(null);
    setGenesisMessage(null);
    setGenesisId(null);
    setIsComplete(false);
    setIsFailed(false);

    try {
      await genesisOrchestrator.orchestrate(manifest);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setValidationErrors([errorMessage]);
      setGenesisStatus("Error");
      setIsFailed(true);
    }
  };

  const resetForm = () => {
    setAgentName("");
    setAgentClass("researcher");
    setSelectedCaps([]);
    setValidationErrors([]);
    setGenesisStatus(null);
    setGenesisProgress(null);
    setGenesisMessage(null);
    setGenesisId(null);
    setIsComplete(false);
    setIsFailed(false);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#101018]/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-5 shadow-[0_0_25px_rgba(96,0,255,0.25)]"
        >
          <h1 className="text-2xl font-bold tracking-wide text-purple-300">
            Agent Genesis
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Forge new autonomous agents for the SAGE Federation.
          </p>
        </motion.div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 space-y-6 min-w-0">
          {/* Agent Name */}
          <div>
            <label className="text-sm text-slate-400">Agent Name</label>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="ex: horizon_watcher"
              className="mt-1 w-full bg-[#0c0c13] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 text-slate-200"
            />
          </div>

          {/* Class Selector */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Agent Class</label>
            <div className="grid grid-cols-2 gap-3">
              {agentClasses.map((cls) => {
                const Icon = cls.icon;
                const active = agentClass === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setAgentClass(cls.id)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-left
                      transition-all border 
                      ${active ? "bg-purple-600/30 border-purple-500 shadow-lg" : "bg-[#0c0c13]/80 border-slate-700 hover:border-slate-600"}
                    `}
                  >
                    <Icon className="w-5 h-5 text-purple-300" />
                    <span className="text-sm text-slate-200">{cls.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Capabilities</label>
            <div className="grid grid-cols-2 gap-2">
              {capabilities.map((cap) => {
                const active = selectedCaps.includes(cap);
                return (
                  <button
                    key={cap}
                    onClick={() => toggleCap(cap)}
                    className={`
                      text-xs px-3 py-2 rounded-md border transition
                      ${active ? "border-purple-500 bg-purple-600/20 text-purple-300" : "border-slate-700 bg-[#0c0c13] text-slate-400 hover:border-slate-600"}
                    `}
                  >
                    {cap}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-300 mb-1">Validation Errors</h4>
                  <ul className="text-xs text-red-200 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Genesis Status */}
          {(genesisStatus || isLoading) && (
            <div className={`border rounded-lg p-4 ${
              isComplete 
                ? "bg-emerald-900/20 border-emerald-500/40" 
                : isFailed 
                ? "bg-red-900/20 border-red-500/40"
                : "bg-purple-900/20 border-purple-500/40"
            }`}>
              <div className="flex items-start gap-3">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0 mt-0.5" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : isFailed ? (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : null}
                <div className="flex-1 min-w-0">
                  {genesisStatus && (
                    <h4 className="text-sm font-semibold mb-1 text-slate-200">
                      {genesisStatus}
                    </h4>
                  )}
                  {genesisMessage && (
                    <p className="text-xs text-slate-300 mb-2">{genesisMessage}</p>
                  )}
                  {genesisProgress !== null && (
                    <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isComplete
                            ? "bg-emerald-500"
                            : isFailed
                            ? "bg-red-500"
                            : "bg-purple-500"
                        }`}
                        style={{ width: `${genesisProgress}%` }}
                      />
                    </div>
                  )}
                  {genesisId && (
                    <p className="text-xs text-slate-400 mt-2 font-mono">
                      Genesis ID: {genesisId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manifest Preview */}
          <div className="bg-[#0b0b12]/80 border border-slate-800 rounded-lg p-4 min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Manifest Preview
            </h3>
            <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words overflow-x-auto">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </div>

          {/* Forge Button / Reset Button */}
          {isComplete ? (
            <button
              onClick={resetForm}
              className="w-full py-3 bg-emerald-700/70 hover:bg-emerald-600 rounded-lg transition shadow-lg font-semibold text-slate-100"
            >
              Forge Another Agent
            </button>
          ) : (
            <button
              onClick={handleForge}
              disabled={isLoading || !agentName.trim() || selectedCaps.length === 0}
              className="w-full py-3 bg-purple-700/70 hover:bg-purple-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed rounded-lg transition shadow-lg font-semibold text-slate-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Forging Agent...</span>
                </>
              ) : (
                "Forge Agent"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

