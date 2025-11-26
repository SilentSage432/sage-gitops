import React, { useEffect, useState } from 'react';

/**
 * StatusBar – Bottom status line showing GitOps, node health, epoch, time
 */
export const StatusBar: React.FC = () => {
  const [shield, setShield] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    function onSafeguard(e: CustomEvent) {
      const { action, payload } = e.detail;
      if (action === "ui.safeguard.trigger" && payload?.action === "STABILIZE") {
        setShield(true);
        setTimeout(() => setShield(false), 4000);
      }
    }

    window.addEventListener("SAGE_UI_ACTION", onSafeguard as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ACTION", onSafeguard as EventListener);
  }, []);

  useEffect(() => {
    function onRecovery(e: CustomEvent) {
      const { action, payload } = e.detail;
      if (action === "ui.recovery.start") {
        setRecovery(true);
      }
      if (action === "ui.recovery.complete" && payload?.restored === true) {
        setTimeout(() => setRecovery(false), 3000);
      }
    }

    window.addEventListener("SAGE_UI_ACTION", onRecovery as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ACTION", onRecovery as EventListener);
  }, []);

  useEffect(() => {
    function onAlert(e: CustomEvent) {
      const { action, payload } = e.detail;
      if (action === "ui.recovery.alert" && payload?.severity === "ELEVATED") {
        setElevated(true);
        setTimeout(() => setElevated(false), 6000);
      }
    }

    window.addEventListener("SAGE_UI_ACTION", onAlert as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ACTION", onAlert as EventListener);
  }, []);

  return (
    <div className="w-full h-full border-t border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between px-6 text-xs">
      <div className="flex items-center gap-4 text-slate-400">
        <span>SAGE Federation — Online</span>
        {shield && (
          <span className="text-purple-400 animate-pulse mr-3">
            AUTO-STABILIZING…
          </span>
        )}
        {recovery && (
          <span className="text-emerald-400 animate-pulse mr-3">
            SELF-HEALING ACTIVE…
          </span>
        )}
        {elevated && (
          <span className="text-amber-400 animate-pulse mr-3">
            ⚠ SYSTEM INSTABILITY PATTERN DETECTED
          </span>
        )}
      </div>
    </div>
  );
};

