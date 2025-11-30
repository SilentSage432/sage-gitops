// Phase 79: Passive Execution Ledger
// UI component for displaying execution ledger
// Shows who attempted what, where, with what identity, under what mode, with what result
// The UI becomes: transparent, observable, introspective, self-debugging

import React, { useEffect, useState } from "react";

interface LedgerEntry {
  envelope?: {
    action?: string;
    timestamp?: number;
    operator?: any;
    destination?: string;
    hardware?: {
      keyId?: string | null;
      verified?: boolean;
    };
  };
  gate?: any;
  hardwareAllowed?: boolean;
  result?: {
    allowed?: boolean;
    reasons?: string[];
    checks?: any;
  };
  loggedAt?: number;
}

interface ExecutionLedgerPanelProps {
  refreshInterval?: number;
}

/**
 * ExecutionLedgerPanel - Display passive execution ledger
 * Every sovereign system needs this - makes the system transparent, observable,
 * introspective, and self-debugging
 */
export function ExecutionLedgerPanel({ refreshInterval = 5000 }: ExecutionLedgerPanelProps) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/execution/ledger");
      if (!res.ok) {
        throw new Error("Failed to fetch ledger");
      }
      const data = await res.json();
      setLedger(data.ledger || []);
    } catch (error) {
      console.error("Failed to fetch execution ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="p-4 bg-black text-white border border-blue-500 rounded">
        <h3 className="mb-2 font-bold text-blue-300">Execution Ledger</h3>
        <div className="text-blue-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-black text-white border border-blue-500 rounded">
      <h3 className="mb-2 font-bold text-blue-300">Execution Ledger</h3>
      <div className="text-xs text-blue-400 mb-3">
        {ledger.length} execution attempt(s) recorded
      </div>
      
      {ledger.length === 0 ? (
        <div className="text-blue-400 text-sm italic">
          No execution attempts recorded yet
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {ledger.map((entry, i) => (
            <div
              key={i}
              className="p-3 bg-[#0a0a0a] border border-blue-900/50 rounded text-xs"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-blue-400 font-semibold">
                  Entry #{ledger.length - i}
                </span>
                {entry.loggedAt && (
                  <span className="text-blue-500 text-xs">
                    {new Date(entry.loggedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              {entry.envelope?.action && (
                <div className="mb-1">
                  <span className="text-blue-300">Action: </span>
                  <span className="text-white font-mono">{entry.envelope.action}</span>
                </div>
              )}
              
              {entry.envelope?.destination && (
                <div className="mb-1">
                  <span className="text-blue-300">Destination: </span>
                  <span className="text-white">{entry.envelope.destination}</span>
                </div>
              )}
              
              {entry.envelope?.operator && (
                <div className="mb-1">
                  <span className="text-blue-300">Operator: </span>
                  <span className="text-white font-mono">{entry.envelope.operator.id || "unknown"}</span>
                </div>
              )}
              
              {entry.result?.allowed !== undefined && (
                <div className="mb-1">
                  <span className="text-blue-300">Result: </span>
                  <span className={entry.result.allowed ? "text-green-400" : "text-red-400"}>
                    {entry.result.allowed ? "Allowed" : "Denied"}
                  </span>
                </div>
              )}
              
              {entry.result?.reasons && entry.result.reasons.length > 0 && (
                <div className="mb-1">
                  <span className="text-blue-300">Reasons: </span>
                  <span className="text-red-300 text-xs">
                    {entry.result.reasons.join(", ")}
                  </span>
                </div>
              )}
              
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs">
                  View Full Details
                </summary>
                <pre className="mt-2 text-xs bg-[#050505] p-2 rounded overflow-auto">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

