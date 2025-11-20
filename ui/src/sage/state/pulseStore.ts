import { create } from "zustand";

interface FederationEvent {
  id: string;
  signal: string;
  timestamp: string;
  source: string;
  payload?: any;
  signature?: string;
}

interface PulseStore {
  pulses: FederationEvent[];
  pushPulse: (evt: FederationEvent) => void;
}

export const usePulseStore = create<PulseStore>((set) => ({
  pulses: [],
  pushPulse: (evt) =>
    set((state) => ({
      pulses: [...state.pulses.slice(-200), evt], // keep 200 last events
    })),
}));

