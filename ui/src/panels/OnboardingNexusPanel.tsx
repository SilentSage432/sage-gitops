import React from "react";
import { exportFederationEnvelope } from "../federation/token";

const OnboardingNexusPanel: React.FC = () => {
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
    </div>
  );
};

export default OnboardingNexusPanel;

