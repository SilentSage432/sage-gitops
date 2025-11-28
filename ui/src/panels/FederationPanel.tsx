// Phase 14.7: Federation Backplane Console
// SAGE Prime UI becomes the federated control plane viewer
import { useEffect, useState } from "react";
import { fetchNodes, fetchEvents, type FederationNode, type FederationEvent } from "@/lib/api/federation";
import FederationCommandConsole from "@/components/FederationCommandConsole";

export default function FederationPanel() {
  const [nodes, setNodes] = useState<FederationNode[]>([]);
  const [events, setEvents] = useState<FederationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        const nodesData = await fetchNodes();
        const eventsData = await fetchEvents();
        setNodes(nodesData.nodes || []);
        setEvents(eventsData.events || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch federation data");
        console.error("Federation data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation Backplane</h2>
        <p className="text-slate-400">Loading federation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Federation Backplane</h2>
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-sm text-slate-200">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Federation Control Plane</p>
        <h2 className="text-2xl font-semibold text-white">Federation Backplane</h2>
        <p className="text-slate-400">
          Real-time view of federated nodes and events across the distributed system.
        </p>
      </header>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2 text-white">Nodes ({nodes.length})</h3>
          {nodes.length === 0 ? (
            <p className="text-slate-400">No nodes registered</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-white/5 p-4 space-y-2">
              {nodes.map((node) => (
                <div
                  key={node.nodeId}
                  className="flex items-center justify-between p-2 rounded border border-white/5 bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        node.status === "online" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-mono text-sm">{node.nodeId}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {node.status} • {new Date(node.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-white">Recent Events ({events.length})</h3>
          {events.length === 0 ? (
            <p className="text-slate-400">No events recorded</p>
          ) : (
            <div className="rounded-lg border border-white/5 bg-black/50 p-4">
              <pre className="text-cyan-400 text-xs font-mono overflow-x-auto">
                {JSON.stringify(events.slice(-20), null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <FederationCommandConsole />
        </div>
      </div>
    </div>
  );
}

