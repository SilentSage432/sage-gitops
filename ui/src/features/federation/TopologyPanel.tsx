// Phase 16.8: Federation Topology Panel (Read-Only)
// Graph visualization of federation structure: nodes and edges
// Pure visibility - no interaction, no mutations, no execution
import { useEffect, useState } from "react";
import { fetchFederationState, type FederationStateResponse } from "@/lib/api/federation";

export default function TopologyPanel() {
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
        setError(err instanceof Error ? err.message : "Failed to fetch federation topology");
        console.error("Federation topology fetch error:", err);
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
        <h2 className="text-xl font-bold mb-4">Federation Topology</h2>
        <p className="text-slate-400">Loading topology…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation Topology</h2>
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!state || !state.topology) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation Topology</h2>
        <p className="text-slate-400">No topology data available</p>
      </div>
    );
  }

  const { topology } = state;

  return (
    <div className="p-6 space-y-6 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Federation Structure</p>
        <h2 className="text-2xl font-semibold text-white">Federation Topology</h2>
        <p className="text-slate-400">
          Graph representation of federation nodes and connectivity channels.
        </p>
        <p className="text-xs text-slate-500">
          Last updated: {new Date(state.ts).toLocaleTimeString()}
        </p>
      </header>

      <div className="space-y-4">
        <section>
          <h3 className="font-semibold mb-2 text-white">
            Nodes ({topology.nodes?.length || 0})
          </h3>
          {!topology.nodes || topology.nodes.length === 0 ? (
            <p className="text-slate-400">No nodes in topology</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <div className="space-y-2">
                {topology.nodes.map((node, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/5"
                  >
                    <span className="block w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-mono text-sm">{node.id}</span>
                    {node.type && (
                      <span className="text-xs text-slate-400">({node.type})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">
            Edges ({topology.edges?.length || 0})
          </h3>
          {!topology.edges || topology.edges.length === 0 ? (
            <p className="text-slate-400">No edges in topology</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <div className="space-y-2">
                {topology.edges.map((edge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded border border-white/5 bg-white/5"
                  >
                    <span className="text-xs text-slate-400 font-mono">{edge.source}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-cyan-400 text-xs font-semibold">{edge.channel}</span>
                    {edge.target && (
                      <>
                        <span className="text-slate-500">→</span>
                        <span className="text-xs text-slate-400 font-mono">{edge.target}</span>
                      </>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(edge.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-white">Raw Topology Data</h3>
          <div className="rounded-lg border border-white/5 bg-black/50 p-4">
            <pre className="text-slate-300 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(topology, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

