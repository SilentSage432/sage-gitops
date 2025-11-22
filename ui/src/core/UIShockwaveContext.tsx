import React, { createContext, useContext, useState } from "react";

type AlertLevel = "none" | "warning" | "critical";

interface UIShockwaveState {
  level: AlertLevel;
  burst: boolean;
}

interface UIShockwaveContextProps {
  state: UIShockwaveState;
  triggerWarning: () => void;
  triggerCritical: () => void;
  shockwaveMinor: () => void;
  reset: () => void;
}

const UIShockwaveContext = createContext<UIShockwaveContextProps | null>(null);

export const UIShockwaveProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UIShockwaveState>({
    level: "none",
    burst: false,
  });

  const triggerWarning = () => {
    setState({ level: "warning", burst: true });
    setTimeout(() => setState({ level: "none", burst: false }), 1200);
  };

  const triggerCritical = () => {
    setState({ level: "critical", burst: true });
    setTimeout(() => setState({ level: "none", burst: false }), 1500);
  };

  const shockwaveMinor = () => {
    setState({ level: "warning", burst: true });
    setTimeout(() => setState({ level: "none", burst: false }), 600);
  };

  const reset = () => setState({ level: "none", burst: false });

  return (
    <UIShockwaveContext.Provider
      value={{ state, triggerWarning, triggerCritical, shockwaveMinor, reset }}
    >
      {children}
    </UIShockwaveContext.Provider>
  );
};

export const useUIShockwave = () => {
  const ctx = useContext(UIShockwaveContext);
  if (!ctx) throw new Error("useUIShockwave must be inside provider");
  return ctx;
};

