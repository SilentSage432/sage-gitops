// Phase 78: Passive Enforcement Simulation
// UI component for displaying complete execution authorization simulation
// Shows a fully visible pipeline from intent → permission

import React from "react";

interface ExecutionSimulationViewerProps {
  data?: {
    envelope?: any;
    gate?: any;
    hardwareAllowed?: boolean;
    result?: {
      simulate?: boolean;
      allowed?: boolean;
      reasons?: string[];
      checks?: {
        operator?: boolean;
        identity?: boolean;
        mode?: boolean;
        policy?: boolean;
        approval?: boolean;
        hardware?: boolean;
      };
      timestamp?: number;
    };
    note?: string;
  };
}

/**
 * ExecutionSimulationViewer - Display complete authorization simulation result
 * Shows all checks: destination rules, hardware rules, mode rules, approval, policy, identity
 * This is a dry-run of execution legality - FANTASTIC for debugging
 */
export function ExecutionSimulationViewer({ data }: ExecutionSimulationViewerProps) {
  if (!data || !data.result) return null;

  const { result } = data;

  return (
    <div className="p-4 bg-black text-white border border-yellow-500 rounded">
      <h3 className="mb-3 font-bold text-yellow-300">Execution Authorization Simulation</h3>
      
      {result.allowed !== undefined && (
        <div className="mb-3 text-sm">
          <span className="text-yellow-400 font-semibold">Allowed: </span>
          <span className={result.allowed ? "text-green-400 font-bold text-base" : "text-red-400 font-bold text-base"}>
            {result.allowed ? "Yes" : "No"}
          </span>
        </div>
      )}
      
      {result.checks && (
        <div className="mb-3 space-y-1 text-xs">
          <div className="text-yellow-400 font-semibold mb-1">Checks:</div>
          <div className="grid grid-cols-2 gap-1 ml-2">
            <div>
              Operator: <span className={result.checks.operator ? "text-green-400" : "text-red-400"}>
                {result.checks.operator ? "✓" : "✗"}
              </span>
            </div>
            <div>
              Identity: <span className={result.checks.identity ? "text-green-400" : "text-red-400"}>
                {result.checks.identity ? "✓" : "✗"}
              </span>
            </div>
            <div>
              Mode: <span className={result.checks.mode ? "text-green-400" : "text-red-400"}>
                {result.checks.mode ? "✓" : "✗"}
              </span>
            </div>
            <div>
              Policy: <span className={result.checks.policy ? "text-green-400" : "text-red-400"}>
                {result.checks.policy ? "✓" : "✗"}
              </span>
            </div>
            <div>
              Approval: <span className={result.checks.approval ? "text-green-400" : "text-red-400"}>
                {result.checks.approval ? "✓" : "✗"}
              </span>
            </div>
            <div>
              Hardware: <span className={result.checks.hardware ? "text-green-400" : "text-red-400"}>
                {result.checks.hardware ? "✓" : "✗"}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {result.reasons && result.reasons.length > 0 && (
        <div className="mb-3">
          <div className="text-yellow-400 font-semibold text-sm mb-1">Reasons:</div>
          <ul className="list-disc list-inside text-xs text-red-300 space-y-1 ml-2">
            {result.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      
      {result.allowed && result.reasons && result.reasons.length === 0 && (
        <div className="mb-3 text-xs text-green-400">
          ✓ All checks passed - execution would be allowed
        </div>
      )}
      
      {data.note && (
        <div className="mb-3 text-xs text-yellow-500 italic">{data.note}</div>
      )}
      
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-yellow-400 hover:text-yellow-300 mb-2">
          View Full Simulation Details
        </summary>
        <pre className="text-xs bg-[#0a0a0a] p-2 rounded border border-yellow-900/50 overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

