import React, { createContext, useContext, useCallback } from "react";

interface UIPulseContextProps {
  pulseSoft: () => void;
  pulseMedium: () => void;
  pulseStrong: () => void;
}

const UIPulseContext = createContext<UIPulseContextProps | null>(null);

export const UIPulseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pulseSoft = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent("UI_PULSE", { detail: { intensity: "soft" } })
    );
  }, []);

  const pulseMedium = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent("UI_PULSE", { detail: { intensity: "medium" } })
    );
  }, []);

  const pulseStrong = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent("UI_PULSE", { detail: { intensity: "strong" } })
    );
  }, []);

  return (
    <UIPulseContext.Provider value={{ pulseSoft, pulseMedium, pulseStrong }}>
      {children}
    </UIPulseContext.Provider>
  );
};

export const useUIPulse = () => {
  const ctx = useContext(UIPulseContext);
  if (!ctx) throw new Error("useUIPulse must be inside provider");
  return ctx;
};

