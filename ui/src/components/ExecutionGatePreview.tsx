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
      <pre className="text-xs">{JSON.stringify(preview, null, 2)}</pre>
    </div>
  );
}

