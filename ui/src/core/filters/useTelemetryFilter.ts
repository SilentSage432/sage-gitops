import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type TelemetryFilter =
  | "ALL"
  | "SYSTEM"
  | "ARC"
  | "RHO2"
  | "FEDERATION"
  | "AGENT"
  | "WHISPERER"
  | "ERROR"
  | "DEBUG"
  | "HEARTBEAT";

interface FilterState {
  activeFilter: TelemetryFilter;
  setActiveFilter: (f: TelemetryFilter) => void;
}

const TelemetryFilterContext = createContext<FilterState>({
  activeFilter: "ALL",
  setActiveFilter: () => {},
});

export function TelemetryFilterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeFilter, setActiveFilter] = useState<TelemetryFilter>("ALL");

  const value = useMemo(
    () => ({ activeFilter, setActiveFilter }),
    [activeFilter]
  );

  return (
    <TelemetryFilterContext.Provider value={value}>
      {children}
    </TelemetryFilterContext.Provider>
  );
}

export function useTelemetryFilter() {
  return useContext(TelemetryFilterContext);
}

