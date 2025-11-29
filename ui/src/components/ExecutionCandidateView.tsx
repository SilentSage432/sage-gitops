import React from "react";

interface ExecutionCandidateViewProps {
  result?: {
    action: string;
    candidates: Array<{
      agent: string;
      role: string;
      status: string;
      confidence: number;
      risk: number;
      fallbackTier: number;
      safetyLevel: string;
    }>;
    totalEligible: number;
    primaryCandidates: any[];
    fallbackCandidates: any[];
    reason: string;
    timestamp: number;
  };
}

export function ExecutionCandidateView({ result }: ExecutionCandidateViewProps) {
  if (!result) return null;

  return (
    <div className="rounded border border-blue-600 p-4 text-blue-400 bg-black">
      <h3 className="font-bold mb-2">Execution Candidates</h3>
      <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

