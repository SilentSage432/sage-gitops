import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Cog, Shield, Brain, Eye, FileCode } from "lucide-react";

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

  const toggleCap = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  // Preview manifest text
  const manifest = {
    name: agentName || "unnamed_agent",
    class: agentClass,
    capabilities: selectedCaps,
    version: 1,
    mode: "active",
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

          {/* Manifest Preview */}
          <div className="bg-[#0b0b12]/80 border border-slate-800 rounded-lg p-4 min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Manifest Preview
            </h3>
            <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words overflow-x-auto">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </div>

          {/* Forge Button */}
          <button
            onClick={() => alert("Agent forging coming online with Pi Cluster")}
            className="w-full py-3 bg-purple-700/70 hover:bg-purple-600 rounded-lg transition shadow-lg font-semibold text-slate-100"
          >
            Forge Agent
          </button>
        </div>
      </div>
    </div>
  );
};

