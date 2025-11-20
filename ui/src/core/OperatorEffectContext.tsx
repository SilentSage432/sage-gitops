import React, { createContext, useContext, useReducer } from "react";

export type OperatorEffect =
  | { type: "FLASH_PURPLE" }
  | { type: "FOCUS_WHISPERER" }
  | { type: "NOTIFY"; message: string };

interface OperatorState {
  flash: boolean;
  notification: string | null;
}

const initialState: OperatorState = {
  flash: false,
  notification: null,
};

function operatorReducer(state: OperatorState, effect: OperatorEffect): OperatorState {
  switch (effect.type) {
    case "FLASH_PURPLE":
      return { ...state, flash: true };

    case "FOCUS_WHISPERER":
      return state; // handled visually in a later phase

    case "NOTIFY":
      return { ...state, notification: effect.message };

    default:
      return state;
  }
}

const OperatorEffectContext = createContext<any>(null);

export function OperatorEffectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(operatorReducer, initialState);

  return (
    <OperatorEffectContext.Provider value={{ state, dispatch }}>
      {children}
    </OperatorEffectContext.Provider>
  );
}

export function useOperatorEffect() {
  return useContext(OperatorEffectContext);
}

