import React from "react";

interface ExecutionGateViewProps {
  gate?: {
    action: string;
    allowed: boolean;
    reasons: string[];
    requirements?: {
      identity: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      approval: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      riskBoundary: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      policyMatch: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
      authority: {
        required: boolean;
        satisfied: boolean;
        reason: string;
      };
    };
    clearance: string;
    note?: string;
    timestamp: number;
  };
}

export function ExecutionGateView({ gate }: ExecutionGateViewProps) {
  if (!gate) return null;

  return (
    <div className="p-4 border border-teal-600 bg-black text-teal-400 rounded">
      <h3 className="font-bold mb-2">Execution Gate Status</h3>
      <pre className="text-xs">{JSON.stringify(gate, null, 2)}</pre>
    </div>
  );
}

