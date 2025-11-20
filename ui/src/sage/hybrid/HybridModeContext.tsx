import React, { createContext, useContext, useState } from "react";

export type HybridModeState = "manual" | "hybrid" | "autonomous";

interface HybridContextShape {
  mode: HybridModeState;
  setMode: (m: HybridModeState) => void;

  // SAGE signals UI wants to react
  requestUIAction: (action: string, payload?: any) => void;

  // Operator-approved dispatcher
  dispatchUIAction: (action: string, payload?: any) => void;
}

const HybridModeContext = createContext<HybridContextShape | null>(null);

export function HybridModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<HybridModeState>("hybrid");
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    payload?: any;
  } | null>(null);

  function requestUIAction(action: string, payload?: any) {
    // SAGE proposes an action — operator decides in hybrid
    if (mode === "manual") return; // SAGE blocked fully
    if (mode === "autonomous") {
      dispatchUIAction(action, payload);
      return;
    }

    // Hybrid mode — hold request until operator confirms
    setPendingAction({ action, payload });
  }

  function dispatchUIAction(action: string, payload?: any) {
    const event = new CustomEvent("SAGE_UI_ACTION", {
      detail: { action, payload },
    });
    window.dispatchEvent(event);
  }

  return (
    <HybridModeContext.Provider
      value={{
        mode,
        setMode,
        requestUIAction,
        dispatchUIAction,
      }}
    >
      {/* Operator Approvals UI (only shows in hybrid mode) */}
      {pendingAction && mode === "hybrid" && (
        <div className="fixed bottom-4 right-4 bg-slate-900/90 border border-purple-600 rounded-xl px-6 py-4 shadow-xl z-50">
          <div className="text-slate-200 mb-2">
            <strong>SAGE Request:</strong> {pendingAction.action}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-purple-700 text-white rounded"
              onClick={() => {
                dispatchUIAction(pendingAction.action, pendingAction.payload);
                setPendingAction(null);
              }}
            >
              Approve
            </button>
            <button
              className="px-3 py-1 bg-slate-700 text-white rounded"
              onClick={() => setPendingAction(null)}
            >
              Deny
            </button>
          </div>
        </div>
      )}
      {children}
    </HybridModeContext.Provider>
  );
}

export const useHybrid = () => {
  const ctx = useContext(HybridModeContext);
  if (!ctx) throw new Error("useHybrid must be inside HybridModeProvider");
  return ctx;
};

