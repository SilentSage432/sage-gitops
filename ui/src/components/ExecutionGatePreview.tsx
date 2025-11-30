import React from "react";

interface ExecutionGatePreviewProps {
  preview?: {
    action: string;
    allowed: boolean;
    preview: boolean;
    status: string;
    wouldAllow?: boolean;
    mode?: string;
    operator?: {
      id?: string;
      mfa?: boolean;
      role?: string;
      [key: string]: any;
    } | null;
    operatorApproval?: boolean;
    policy?: any;
    reasons: string[];
    requirements?: any;
    envelope?: {
      destination?: string;
      [key: string]: any;
    };
    note?: string;
    timestamp: number;
  };
}

export function ExecutionGatePreview({ preview }: ExecutionGatePreviewProps) {
  if (!preview) return null;

  return (
    <div className="p-4 border border-indigo-500 bg-black text-indigo-300 rounded">
      <h3 className="font-bold mb-2">Execution Preview</h3>
      {preview.status && (
        <div className="mb-2 text-sm">
          <span className="text-indigo-400 font-semibold">Status: </span>
          <span className="text-indigo-300">{preview.status}</span>
        </div>
      )}
      {preview.envelope?.destination && (
        <div className="mb-2 text-sm">
          <span className="text-indigo-400 font-semibold">Destination: </span>
          <span className="text-indigo-300">{preview.envelope.destination}</span>
        </div>
      )}
      {preview.reasons && preview.reasons.includes("destination not permitted") && (
        <div className="mb-2 text-red-400 text-sm">
          Destination not permitted
        </div>
      )}
      <pre className="text-xs">{JSON.stringify(preview, null, 2)}</pre>
    </div>
  );
}

