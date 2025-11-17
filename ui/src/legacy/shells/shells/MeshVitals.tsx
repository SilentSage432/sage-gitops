import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { cn } from '../utils/cn';

type MeshSummary = {
  meshId: string;
  clusters: {
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'offline';
    nodes: number;
    location?: string;
    controlPlane?: boolean;
  }[];
  agents: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
  services: {
    api: string;
    ui: string;
    ingress?: string;
    [k: string]: string | undefined;
  };
  updatedAt: string;
};

type AgentInfo = {
  id: string;
  type: string;
  role: string;
  status: string;
  cluster: string;
};

function getApiBase(): string {
  try {
    if (typeof (window as any).getApiBase === 'function') {
      return (window as any).getApiBase();
    }
    if ((window as any).SAGE_API_BASE) {
      return (window as any).SAGE_API_BASE.replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return '/api';
}

const apiBase = getApiBase();

export function MeshVitals() {
  const [summary, setSummary] = useState<MeshSummary | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, agentsRes] = await Promise.all([
          fetch(`${apiBase}/vitals/summary`),
          fetch(`${apiBase}/vitals/agents`),
        ]);

        if (!summaryRes.ok) throw new Error(`summary ${summaryRes.status}`);
        if (!agentsRes.ok) throw new Error(`agents ${agentsRes.status}`);

        const s = (await summaryRes.json()) as MeshSummary;
        const a = (await agentsRes.json()) as AgentInfo[];

        if (!cancelled) {
          setSummary(s);
          setAgents(a);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('MeshVitals load failed', err);
          setError('Unable to load federation vitals');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const id = setInterval(load, 15000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading && !summary) {
    return (
      <div className="p-6 text-cyan-300">
        Loading federation vitals…
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-6 text-red-400">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-slate-400">
        No vitals data available.
      </div>
    );
  }

  const primary = summary.clusters[0];

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            SAGE Federation
          </div>
          <div className="text-2xl font-semibold">
            {summary.meshId}
          </div>
          {primary && (
            <div className="text-sm text-slate-400">
              Anchor: {primary.name} · {primary.nodes} node
              {primary.nodes !== 1 && 's'}
              {primary.location ? ` · ${primary.location}` : ''}
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Updated {new Date(summary.updatedAt).toLocaleTimeString()}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Agents"
          value={summary.agents.total}
          detail={`${summary.agents.healthy} healthy`}
          tone="good"
        />
        <StatCard
          label="Degraded"
          value={summary.agents.degraded}
          detail="requiring attention"
          tone={summary.agents.degraded > 0 ? 'warn' : 'muted'}
        />
        <StatCard
          label="Offline"
          value={summary.agents.offline}
          detail="unreachable"
          tone={summary.agents.offline > 0 ? 'bad' : 'muted'}
        />
        <StatCard
          label="Core Services"
          value="OK"
          detail={`API: ${summary.services.api}, UI: ${summary.services.ui}`}
          tone="good"
        />
      </div>

      {/* Agents list */}
      <Card className="bg-slate-950/40 border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 text-sm text-slate-300">
          Federation components
        </div>
        <div className="divide-y divide-slate-900 text-xs">
          {agents.map((a) => (
            <div
              key={a.id}
              className="px-4 py-2 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col">
                <span className="font-mono text-slate-100">{a.id}</span>
                <span className="text-slate-500">
                  {a.type} · {a.role}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-slate-500">
                  {a.cluster}
                </span>
                <StatusPill status={a.status} />
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="px-4 py-4 text-slate-500">
              No agents reported yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard(props: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'good' | 'warn' | 'bad' | 'muted';
}) {
  const tone = props.tone || 'muted';
  return (
    <Card
      className={cn(
        'bg-slate-950/40 border',
        tone === 'good' && 'border-emerald-500/40',
        tone === 'warn' && 'border-amber-500/40',
        tone === 'bad' && 'border-red-500/40',
        tone === 'muted' && 'border-slate-800'
      )}
    >
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {props.label}
        </div>
        <div className="text-xl font-semibold text-slate-50">
          {props.value}
        </div>
        {props.detail && (
          <div className="text-[11px] text-slate-500">
            {props.detail}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone =
    s === 'healthy'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : s === 'degraded'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
      : s === 'offline'
      ? 'bg-red-500/10 text-red-300 border-red-500/40'
      : 'bg-slate-800 text-slate-300 border-slate-600';

  return (
    <span
      className={cn(
        'px-2 py-[2px] rounded-full text-[10px] font-medium border',
        tone
      )}
    >
      {status}
    </span>
  );
}

export default MeshVitals;
