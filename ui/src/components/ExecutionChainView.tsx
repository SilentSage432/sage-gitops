import React from "react";

interface ExecutionChainViewProps {
  chain?: {
    action: string;
    chain: Array<{
      sequence: number;
      agent: string;
      role: string;
      status: string;
      capabilities: string[];
      responsibility: string;
      tier: number;
      confidence: number;
      risk: number;
      fallback: boolean;
      isPrimary: boolean;
      isFallback: boolean;
      isLast: boolean;
    }>;
    totalSteps?: number;
    primarySteps?: number;
    fallbackSteps?: number;
    ordering?: {
      primary: number[];
      fallback: number[];
    };
    timestamp: number;
  };
}

export function ExecutionChainView({ chain }: ExecutionChainViewProps) {
  if (!chain) return null;

  return (
    <div className="p-4 border border-orange-600 bg-black text-orange-400 rounded">
      <h3 className="font-bold mb-2">Execution Chain (Simulated)</h3>
      <pre className="text-xs">{JSON.stringify(chain, null, 2)}</pre>
    </div>
  );
}

