import { create } from "zustand";

interface AppState {
  ready: boolean;
}

interface AppStore extends AppState {
  // Actions can be added here as needed
}

export const useAppStore = create<AppStore>(() => ({
  ready: true,
}));
