import React, { useEffect, useState } from 'react';
import { getDependencies, subscribe } from '../stores/heartbeatStore';
import { DependencyMatrix } from '../components/DependencyMatrix';
import { Card } from '../components/ui/card';

interface Signal {
  id: string;
  source: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  ts: string;
}

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

const fallbackSignals: Signal[] = [
  {
    id: 'sig-1',
    source: 'sage-api',
    severity: 'info',
    message: 'Federation cockpit initialized.',
    ts: new Date().toISOString(),
  },
  {
    id: 'sig-2',
    source: 'arc-ui/sage-enterprise-ui',
    severity: 'warn',
    message: 'Recent UI/API restarts detected. Monitor stability.',
    ts: new Date().toISOString(),
  },
];

export const ForecastAnomaly: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>(fallbackSignals);
  const [dependencies, setDependencies] = useState(() => getDependencies());

  // Subscribe to heartbeat for dependencies
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setDependencies(getDependencies());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (cancelled) return;

      const apiBase = getApiBase();

      try {
        const res = await fetch(`${apiBase}/signals/events`);
        if (!res.ok) {
          console.warn('Signals load failed: events', res.status);
          if (!cancelled) {
            setSignals(fallbackSignals);
          }
          return;
        }

        const data = (await res.json()) as Signal[];
        if (!Array.isArray(data)) {
          console.warn('Signals load failed: invalid response format');
          if (!cancelled) {
            setSignals(fallbackSignals);
          }
          return;
        }

        if (!cancelled) {
          setSignals(data.length > 0 ? data : fallbackSignals);
        }
      } catch (err) {
        console.warn('Signals load failed', err);
        if (!cancelled) {
          setSignals(fallbackSignals);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const signalsStatus = dependencies?.signals?.status;

  return (
    <div style={{ padding: '1.5rem', color: '#e5e7eb' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Signals
      </h1>
      <p
        style={{
          fontSize: '0.7rem',
          color: '#9ca3af',
          maxWidth: '40rem',
          marginBottom: '0.5rem',
        }}
      >
        Curated anomaly and signal stream from across the SAGE federation.
      </p>

      {/* Dependency Matrix */}
      <div style={{ marginBottom: '1rem' }}>
        <DependencyMatrix deps={dependencies} />
      </div>

      {/* Signals offline message */}
      {signalsStatus === 'offline' && (
        <div
          style={{
            padding: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(127, 29, 29, 0.2)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: '0.25rem' }}>
            Signal stream unavailable; waiting for federation link.
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            {dependencies?.signals?.reason || 'Signals stream unavailable'}
          </div>
        </div>
      )}

      <div
        style={{
          border: '1px solid #111827',
          background: '#020817',
          padding: '0.75rem',
          borderRadius: '0.5rem',
        }}
      >
        {signals.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.4rem 0',
              borderBottom: '1px solid rgba(17,24,39,0.7)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: '#9ca3af',
                  marginBottom: '0.1rem',
                }}
              >
                {new Date(s.ts).toLocaleString()} • {s.source}
              </div>
              <div style={{ fontSize: '0.75rem' }}>{s.message}</div>
            </div>
            <SeverityPill severity={s.severity} />
          </div>
        ))}

        {signals.length === 0 && (
          <div
            style={{
              fontSize: '0.65rem',
              color: '#6b7280',
            }}
          >
            No signals yet.
          </div>
        )}
      </div>
    </div>
  );
};

const SeverityPill: React.FC<{ severity: Signal['severity'] }> = ({
  severity,
}) => {
  const label =
    severity === 'critical'
      ? 'Critical'
      : severity === 'warn'
      ? 'Warning'
      : 'Info';

  const background =
    severity === 'critical'
      ? '#f97316'
      : severity === 'warn'
      ? '#fde047'
      : '#38bdf8';

  const color =
    severity === 'warn' || severity === 'info' ? '#020817' : '#020817';

  return (
    <span
      style={{
        padding: '0.15rem 0.45rem',
        borderRadius: '999px',
        fontSize: '0.55rem',
        fontWeight: 600,
        background,
        color,
        whiteSpace: 'nowrap',
        alignSelf: 'flex-start',
      }}
    >
      {label}
    </span>
  );
};

export default ForecastAnomaly;
