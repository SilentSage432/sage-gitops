import React from "react";

interface ExecutionRoutePreviewProps {
  result?: {
    envelope?: {
      action?: string;
      timestamp?: number;
      operator?: any;
      approval?: any;
      mode?: string;
      fingerprint?: string | null;
      policy?: any;
      simulate?: boolean;
    };
    gate?: {
      action?: string;
      allowed?: boolean;
      mode?: string;
      operator?: any;
      operatorApproval?: boolean;
      policy?: any;
      reasons?: string[];
      requirements?: any;
      clearance?: string;
      timestamp?: number;
    };
    routed?: boolean;
    destination?: string | null;
    timestamp?: number;
    note?: string;
  };
}

/**
 * ExecutionRoutePreview - Preview panel for execution envelope routing
 * Shows the envelope moving through a routing channel
 * This is the routing substrate for intention - not messaging, not execution, the layer in between
 */
export function ExecutionRoutePreview({ result }: ExecutionRoutePreviewProps) {
  if (!result) return null;

  return (
    <div className="p-4 border border-cyan-500 bg-black text-white rounded">
      <h3 className="mb-2 font-bold text-cyan-300">Envelope Routing</h3>
      
      {result.routed !== undefined && (
        <div className="mb-2 text-sm">
          <span className="text-cyan-400 font-semibold">Routed: </span>
          <span className={result.routed ? "text-green-400" : "text-red-400"}>
            {result.routed ? "Yes" : "No"}
          </span>
        </div>
      )}
      
      <div className="mb-2 text-sm">
        <span className="text-cyan-400 font-semibold">Destination: </span>
        <span className="text-cyan-300">{result.destination || "Not yet routed"}</span>
      </div>
      
      {result.note && (
        <div className="mb-3 text-xs text-cyan-500 italic">{result.note}</div>
      )}
      
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 mb-2">
          View Full Routing Details
        </summary>
        <pre className="text-xs bg-[#0a0a0a] p-2 rounded border border-cyan-900/50 overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

