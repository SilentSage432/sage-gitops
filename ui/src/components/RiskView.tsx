import React from "react";

interface RiskViewProps {
  risk?: {
    action: string;
    risk: {
      systemImpact: string;
      failureLikelihood: string;
      availabilityImpact: string;
    };
    metrics?: {
      totalCandidates: number;
      onlineCandidates: number;
      primaryCount: number;
      fallbackCount: number;
      averageConfidence: number;
      averageRisk: number;
      maxRisk: number;
    };
    safetyLevel?: string;
    timestamp: number;
  };
}

export function RiskView({ risk }: RiskViewProps) {
  if (!risk) return null;

  return (
    <div className="p-4 border border-red-600 rounded bg-black text-red-400">
      <h3 className="font-bold mb-2">Execution Risk Prediction</h3>
      <pre className="text-xs">{JSON.stringify(risk, null, 2)}</pre>
    </div>
  );
}

