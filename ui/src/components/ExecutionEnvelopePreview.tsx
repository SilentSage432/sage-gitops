import React from "react";

interface ExecutionEnvelopePreviewProps {
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
      hardware?: {
        keyId?: string | null;
        verified?: boolean;
      };
    };
    hardware?: {
      keyId?: string | null;
      verified?: boolean;
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
    allowed?: boolean;
    reason?: string;
    timestamp?: number;
    note?: string;
  };
}

/**
 * ExecutionEnvelopePreview - Preview panel for execution envelope check results
 * Answers: "If execution existed, would this envelope be allowed?"
 * This is powerful - it's the moment where SAGE can preview execution eligibility
 */
export function ExecutionEnvelopePreview({ result }: ExecutionEnvelopePreviewProps) {
  if (!result) return null;

  return (
    <div className="p-4 bg-black text-white border border-purple-500 rounded">
      <h3 className="mb-2 font-bold text-purple-300">Execution Envelope Check</h3>
      
      {result.allowed !== undefined && (
        <div className="mb-2 text-sm">
          <span className="text-purple-400 font-semibold">Allowed: </span>
          <span className={result.allowed ? "text-green-400" : "text-red-400"}>
            {result.allowed ? "Yes" : "No"}
          </span>
        </div>
      )}
      
      {result.envelope?.destination && (
        <div className="mb-2 text-sm">
          <span className="text-purple-400 font-semibold">Destination: </span>
          <span className="text-purple-300">{result.envelope.destination}</span>
        </div>
      )}
      
      {result.destination && (
        <div className="mb-2 text-sm">
          <span className="text-purple-400 font-semibold">Destination Status: </span>
          <span className={result.destination.allowed ? "text-green-400" : "text-red-400"}>
            {result.destination.allowed ? "Allowed" : "Not Allowed"}
          </span>
          {!result.destination.valid && (
            <span className="text-red-400 ml-2">(destination not permitted)</span>
          )}
        </div>
      )}
      
      {(result.hardware || result.envelope?.hardware) && (
        <div className="mb-2 text-sm">
          <span className="text-purple-400 font-semibold">Hardware Key: </span>
          <span className={(result.hardware?.verified || result.envelope?.hardware?.verified) ? "text-green-400" : "text-red-400"}>
            {(result.hardware?.verified || result.envelope?.hardware?.verified) ? "Verified" : "Not verified"}
          </span>
          {(result.hardware?.keyId || result.envelope?.hardware?.keyId) && (
            <span className="text-purple-300 ml-2 font-mono text-xs">
              ({(result.hardware?.keyId || result.envelope?.hardware?.keyId)})
            </span>
          )}
        </div>
      )}
      
      {result.reason && (
        <div className="mb-2 text-sm">
          <span className="text-purple-400 font-semibold">Reason: </span>
          <span className="text-purple-300">{result.reason}</span>
        </div>
      )}
      
      {result.note && (
        <div className="mb-3 text-xs text-purple-500 italic">{result.note}</div>
      )}
      
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 mb-2">
          View Full Details
        </summary>
        <pre className="text-xs bg-[#0a0a0a] p-2 rounded border border-purple-900/50 overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

