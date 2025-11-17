import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface TerminalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const defaultValue: TerminalContextValue = {
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
};

const TerminalContext = createContext<TerminalContextValue>(defaultValue);

export const TerminalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((p) => !p),
    }),
    [isOpen]
  );

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
};

export const useTerminal = () => useContext(TerminalContext);

export default TerminalContext;
