// Phase 15.4: Federation Command Console
// Read-only display of command queue - no control, no triggering, no dispatch
import { useEffect, useState } from "react";
import { fetchCommands, type Command } from "@/lib/api/federation";

export default function FederationCommandConsole() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        const res = await fetchCommands();
        setCommands(res.commands || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch commands");
        console.error("Command fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading && commands.length === 0) {
    return (
      <div className="p-4">
        <h3 className="font-semibold mb-2 text-white">Command Queue</h3>
        <p className="text-slate-400 text-sm">Loading commands...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="font-semibold mb-2 text-white">Command Queue</h3>
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-2 text-white">Command Queue ({commands.length})</h3>
      {commands.length === 0 ? (
        <p className="text-slate-400 text-sm">No commands in queue</p>
      ) : (
        <div className="rounded-lg border border-white/5 bg-black/50 p-4">
          <pre className="text-purple-300 text-xs font-mono overflow-x-auto">
            {JSON.stringify(commands, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

