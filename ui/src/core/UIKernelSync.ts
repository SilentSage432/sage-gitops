import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type KernelState = {
  sagePulse: number;
  shardRotation: number;
  cognitiveLoad: number;
  federationHealth: "green" | "yellow" | "red";
  lastSignal: string | null;

  updatePulse: (v: number) => void;
  updateShard: (v: number) => void;
  updateCognitive: (v: number) => void;
  updateHealth: (v: "green" | "yellow" | "red") => void;
  setLastSignal: (msg: string) => void;
};

export const useKernel = create<KernelState>()(
  subscribeWithSelector((set) => ({
    sagePulse: 0,
    shardRotation: 0,
    cognitiveLoad: 0.08,
    federationHealth: "green",
    lastSignal: null,

    updatePulse: (v) => set({ sagePulse: v }),
    updateShard: (v) => set({ shardRotation: v }),
    updateCognitive: (v) => set({ cognitiveLoad: v }),
    updateHealth: (v) => set({ federationHealth: v }),
    setLastSignal: (msg) => set({ lastSignal: msg }),
  }))
);

