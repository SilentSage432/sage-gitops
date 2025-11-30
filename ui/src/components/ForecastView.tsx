import React from "react";

interface ForecastViewProps {
  result?: {
    action: string;
    candidates: Array<{
      agent: string;
      role: string;
      status: string;
      confidence: number;
      risk: number;
    }>;
    prediction: {
      expectedState: string;
      availability: string;
      fallbackReady: boolean;
      recoveryPlan: string;
    };
    metrics?: {
      totalCandidates: number;
      onlineCount: number;
      primaryOnline: number;
      primaryTotal: number;
      fallbackReady: number;
      averageConfidence: number;
    };
    confidence: string;
    timestamp: number;
  };
}

export function ForecastView({ result }: ForecastViewProps) {
  if (!result) return null;

  return (
    <div className="p-4 border border-purple-600 rounded bg-black text-purple-400">
      <h3 className="font-bold mb-2">Outcome Forecast</h3>
      <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

