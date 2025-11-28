// Phase 15.9: Federation State Panel (Read-Only)
// Operator-grade perspective on federation state: events, commands, subscriptions
// Pure visibility - no interaction, no mutations, no execution
import { useEffect, useState } from "react";
import { fetchFederationState, type FederationStateResponse } from "@/lib/api/federation";

export default function FederationStatePanel() {
  const [state, setState] = useState<FederationStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        const data = await fetchFederationState();
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
    <div className="p-6 space-y-6 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Federation Control Plane</p>
        <h2 className="text-2xl font-semibold text-white">Federation State</h2>
        <p className="text-slate-400">
          Read-only view of federation state: commands, events, subscriptions, and routing metadata.
        </p>
        <p className="text-xs text-slate-500">
          Last updated: {new Date(state.ts).toLocaleTimeString()}
        </p>
      </header>

      <div className="space-y-4">
        <section>
          <h3 className="font-semibold mb-2 text-white">Commands ({state.commands?.length || 0})</h3>
          {!state.commands || state.commands.length === 0 ? (
            <p className="text-slate-400">No commands in queue</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <pre className="text-purple-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(state.commands, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">Events ({state.events?.length || 0})</h3>
          {!state.events || state.events.length === 0 ? (
            <p className="text-slate-400">No events recorded</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <pre className="text-cyan-400 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(state.events.slice(-20), null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">Subscriptions ({state.subscriptions?.length || 0})</h3>
          {!state.subscriptions || state.subscriptions.length === 0 ? (
            <p className="text-slate-400">No subscriptions registered</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <pre className="text-emerald-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(state.subscriptions, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">Intents ({state.intents?.length || 0})</h3>
          {!state.intents || state.intents.length === 0 ? (
            <p className="text-slate-400">No intents declared</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <pre className="text-yellow-300 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(state.intents, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">
            Divergence ({state.divergence?.length || 0})
            {state.divergence && state.divergence.length > 0 && (
              <span className="ml-2 text-xs font-normal">
                (
                {state.divergence.filter((d) => d.status === "aligned").length} aligned,{" "}
                {state.divergence.filter((d) => d.status === "missing").length} missing,{" "}
                {state.divergence.filter((d) => d.status === "diverged").length} diverged
                )
              </span>
            )}
          </h3>
          {!state.divergence || state.divergence.length === 0 ? (
            <p className="text-slate-400">No divergence detected</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4 space-y-2">
              {state.divergence.map((div, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border ${
                    div.status === "aligned"
                      ? "border-green-500/30 bg-green-500/5"
                      : div.status === "missing"
                      ? "border-orange-500/30 bg-orange-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        div.status === "aligned"
                          ? "text-green-400"
                          : div.status === "missing"
                          ? "text-orange-400"
                          : "text-red-400"
                      }`}
                    >
                      {div.status.toUpperCase()}
                    </span>
                    {div.intent.channel && (
                      <span className="text-xs text-slate-400">Channel: {div.intent.channel}</span>
                    )}
                    {div.intent.target && (
                      <span className="text-xs text-slate-400">Target: {div.intent.target}</span>
                    )}
                  </div>
                  <pre className="text-slate-300 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(div.intent, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

