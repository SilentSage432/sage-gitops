import React from 'react';

/**
 * GodViewTab / Mappings Console
 *
 * Preserved legacy console surface, now explicit.
 * This is your human-readable map of how cockpit shells, APIs,
 * and agents tie into the federation.
 */

const rows = [
  {
    label: 'Whisperer',
    source: 'WhispererTerminal',
    target: 'POST /api/whisperer/command',
    notes: 'Primary operator console into SAGE.',
  },
  {
    label: 'Mesh Vitals',
    source: 'MeshVitals',
    target: 'GET /api/vitals/summary',
    notes: 'Cluster + service health.',
  },
  {
    label: 'Lifecycle',
    source: 'AgentLifecycle',
    target: 'GET /api/lifecycle/agents',
    notes: 'Agents + orchestration layer.',
  },
  {
    label: 'Signals',
    source: 'ForecastAnomaly',
    target: 'GET /api/signals/events',
    notes: 'Anomalies + notable events.',
  },
  {
    label: 'Governance',
    source: 'SettingsPolicy',
    target: 'GET/POST /api/governance/*',
    notes: 'Policies, guardrails, capabilities.',
  },
];

export const GodViewTab: React.FC = () => {
  return (
    <div style={{ padding: '1.5rem', color: '#e5e7eb' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Mappings Console / GodView
      </h1>
      <p
        style={{
          fontSize: '0.7rem',
          color: '#9ca3af',
          maxWidth: '40rem',
          marginBottom: '0.75rem',
        }}
      >
        Canonical map from cockpit surfaces to live federation endpoints.
        Replace or extend these rows as the mesh evolves. This is your origin panel.
      </p>

      <div
        style={{
          border: '1px solid #111827',
          background: '#020817',
          padding: '0.75rem',
          borderRadius: '0.5rem',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.65rem',
          }}
        >
          <thead>
            <tr style={{ color: '#9ca3af', borderBottom: '1px solid #111827' }}>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>Label</th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>Source Shell</th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>Federation Target</th>
              <th style={{ textAlign: 'left', padding: '0.25rem 0.5rem' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid rgba(17,24,39,0.7)',
                }}
              >
                <td style={{ padding: '0.25rem 0.5rem', color: '#e5e7eb' }}>
                  {r.label}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', color: '#9ca3af' }}>
                  {r.source}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', color: '#93c5fd' }}>
                  {r.target}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', color: '#9ca3af' }}>
                  {r.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        style={{
          marginTop: '0.75rem',
          fontSize: '0.6rem',
          color: '#6b7280',
        }}
      >
        This panel is intentionally simple and explicit. It&apos;s the place you
        update when you change how SAGE and her federation are wired.
      </p>
    </div>
  );
};

export default GodViewTab;
