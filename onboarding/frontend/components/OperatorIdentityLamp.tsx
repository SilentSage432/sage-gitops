"use client";

// Phase 17.5: Operator Identity Lamp for Onboarding UI
// Displays operator identity status from federation state
// No authentication, no verification, no enforcement - just reflection
import { useEffect, useState } from "react";

interface OperatorIdentity {
  id: string;
  source: string;
  registeredAt: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

export default function OperatorIdentityLamp() {
  const [operator, setOperator] = useState<OperatorIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      try {
        // Phase 17.5: Fetch from federation state API
        // Use relative path for Next.js API routes or direct backend URL
        const res = await fetch("/api/federation/state").catch(() =>
          fetch("http://localhost:8080/federation/state")
        );
        if (res.ok) {
          const data = await res.json();
          setOperator(data.operator || null);
        }
      } catch (err) {
        console.error("Failed to fetch operator identity:", err);
        setOperator(null);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        Operator: <span className="text-slate-400">checking...</span>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-xs">
        <span className="text-slate-400">Operator:</span>{" "}
        <span className="text-orange-500">not registered</span>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <span className="text-slate-400">Operator:</span>{" "}
      <span className="text-green-500 font-mono">{operator.id}</span>
      {operator.source && (
        <span className="text-slate-500 ml-1">({operator.source})</span>
      )}
    </div>
  );
}

