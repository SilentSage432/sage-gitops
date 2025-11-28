"use client";

// Phase 16.6: Federation State Panel for Onboarding UI (Read-Only)
// Operator-grade perspective on federation state: events, commands, subscriptions
// Pure visibility - no interaction, no mutations, no execution
import { useEffect, useState } from "react";

interface FederationStateResponse {
  events: Array<{
    ts: number;
    type: string;
    nodeId: string;
    data: Record<string, unknown>;
    channel?: string;
  }>;
  commands: Array<{
    target: string;
    cmd: string;
    data?: Record<string, unknown>;
    channel?: string;
    ts: number;
  }>;
  subscriptions: Array<{
    id: string;
    channel: string;
    ts: number;
  }>;
  intents: Array<{
    target?: string;
    desired?: string;
    channel?: string;
    scope?: string;
    metadata?: Record<string, unknown>;
    created?: number;
    lifecycle?: string;
    staleAfter?: number;
    ts: number;
  }>;
  divergence: Array<{
    intent: unknown;
    status: "aligned" | "missing" | "diverged";
    match?: unknown;
    ts: number;
  }>;
  lifecycle: Record<string, number>;
  stale: Array<{
    intent: unknown;
    stale: boolean;
    age: number;
  }>;
  ts: number;
}

export default function FederationStatePanel() {
  const [state, setState] = useState<FederationStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        // Phase 16.6: Fetch from federation state API
        // Use relative path for Next.js API routes or full URL for direct backend
        const res = await fetch("/api/federation/state").catch(() =>
          fetch("http://localhost:8080/federation/state")
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch federation state: ${res.statusText}`);
        }
        const data = await res.json();
        setState(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch federation state");
        console.error("Federation state fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading && !state) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation State</h2>
        <p className="text-slate-400">Loading federation state…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation State</h2>
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation State</h2>
        <p className="text-slate-400">No federation state available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 text-sm">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">Federation State</h2>
        <p className="text-slate-400">
          Read-only view of federation state: commands, events, subscriptions, intents, divergence, lifecycle, and staleness.
        </p>
        <p className="text-xs text-slate-500">
          Last updated: {new Date(state.ts).toLocaleTimeString()}
        </p>
      </header>

      <section>
        <h3 className="text-lg font-bold mb-2">Commands ({state.commands?.length || 0})</h3>
        {!state.commands || state.commands.length === 0 ? (
          <p className="text-slate-400">No commands in queue</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-purple-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.commands, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">Events ({state.events?.length || 0})</h3>
        {!state.events || state.events.length === 0 ? (
          <p className="text-slate-400">No events recorded</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-cyan-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.events.slice(-20), null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">Subscriptions ({state.subscriptions?.length || 0})</h3>
        {!state.subscriptions || state.subscriptions.length === 0 ? (
          <p className="text-slate-400">No subscriptions registered</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-emerald-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.subscriptions, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">Intents ({state.intents?.length || 0})</h3>
        {!state.intents || state.intents.length === 0 ? (
          <p className="text-slate-400">No intents declared</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-yellow-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.intents, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">Divergence ({state.divergence?.length || 0})</h3>
        {!state.divergence || state.divergence.length === 0 ? (
          <p className="text-slate-400">No divergence detected</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-orange-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.divergence, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">Lifecycle</h3>
        {!state.lifecycle || Object.keys(state.lifecycle).length === 0 ? (
          <p className="text-slate-400">No lifecycle data</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-blue-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.lifecycle, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2">
          Stale Intents ({state.stale?.filter((s) => s.stale).length || 0} stale)
        </h3>
        {!state.stale || state.stale.length === 0 ? (
          <p className="text-slate-400">No stale intents detected</p>
        ) : (
          <pre className="bg-slate-900 p-4 rounded text-red-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(state.stale, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}

