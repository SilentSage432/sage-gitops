import React, { useEffect, useState } from 'react';

type Mapping = {
  id: string;
  source: string;
  target: string;
  type: string;
  pattern: string;
  status: string;
  notes?: string;
};

type MappingsResponse = {
  meshId: string;
  updatedAt: string;
  items: Mapping[];
};

function getApiBase(): string {
  try {
    if (typeof (window as any).getApiBase === 'function') {
      return (window as any).getApiBase();
    }
    if ((window as any).SAGE_API_BASE) {
      return (window as any).SAGE_API_BASE.toString().replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return '/api';
}

export const MappingsConsole: React.FC = () => {
  const [data, setData] = useState<MappingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBase();

    async function load() {
      try {
        const res = await fetch(`${apiBase}/mappings`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as MappingsResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load mappings');
        }
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-cyan-300">Mappings Console</h1>
        <p className="text-xs text-slate-400">
          Sentimental core console: current wiring between SAGE UI, API, and federation components.
        </p>
      </div>

      {error && (
        <div className="text-[10px] text-red-400 bg-red-950/40 border border-red-900/60 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {!error && !data && (
        <div className="text-[10px] text-slate-500">Loading mappings…</div>
      )}

      {data && (
        <>
          <div className="text-[9px] text-slate-500">
            Mesh: <span className="text-cyan-300">{data.meshId}</span>{' '}
            · Updated {new Date(data.updatedAt).toLocaleTimeString()}
          </div>
          <div className="border border-slate-800/80 rounded-md overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-2 py-1 text-left">Source</th>
                  <th className="px-2 py-1 text-left">Target</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Pattern</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-slate-900/70 hover:bg-slate-900/40"
                  >
                    <td className="px-2 py-1 text-cyan-300">{m.source}</td>
                    <td className="px-2 py-1 text-slate-100">{m.target}</td>
                    <td className="px-2 py-1 text-slate-400">{m.type}</td>
                    <td className="px-2 py-1 text-slate-300">{m.pattern}</td>
                    <td className="px-2 py-1">
                      <span
                        className={
                          m.status === 'active'
                            ? 'px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 text-[8px]'
                            : 'px-1.5 py-0.5 rounded-full bg-slate-900/70 text-slate-400 text-[8px]'
                        }
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-slate-500">
                      {m.notes || ''}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-2 py-3 text-center text-slate-500"
                    >
                      No mappings defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
