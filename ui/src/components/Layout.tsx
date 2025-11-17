import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMetaVersion } from '../lib/useMetaVersion';
import { FederationStatusBar } from './FederationStatusBar';
import { FederationHeader } from './FederationHeader';

const navItems = [
  { to: '/ui/godview', label: 'GodView' },
  { to: '/ui/vitals', label: 'Mesh Vitals' },
  { to: '/ui/signals', label: 'Signals' },
  { to: '/ui/lifecycle', label: 'Lifecycle' },
  { to: '/ui/mappings', label: 'Mappings Console' },
  { to: '/ui/whisperer', label: 'Whisperer' },
  { to: '/ui/settings', label: 'Settings' },
];

export const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { uiBuild, meta } = useMetaVersion();
  const meshId = meta?.meshId || 'sage-federation';
  const apiBuild = meta?.apiBuild || 'dev';
  const ts = meta?.now
    ? new Date(meta.now).toLocaleTimeString()
    : '';

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-slate-800 flex flex-col py-4 px-3 gap-4">
        <div className="text-[10px] text-slate-500 leading-tight">
          <div className="font-semibold text-cyan-300 text-xs">
            SAGE Enterprise UI
          </div>
          <div>Federation Cockpit</div>
          <div className="mt-1 text-[9px] text-slate-600">
            Mesh: <span className="text-cyan-300">{meshId}</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 text-[11px]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'px-2 py-1 rounded-sm transition-colors',
                  'hover:bg-slate-900 hover:text-cyan-300',
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-l-2 border-cyan-400'
                    : 'text-slate-400',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="text-[8px] text-slate-600 space-y-0.5">
          <div>UI build: <span className="text-cyan-300">{uiBuild}</span></div>
          <div>API build: <span className="text-cyan-300">{apiBuild}</span></div>
          {ts && (
            <div>Last meta: <span className="text-slate-400">{ts}</span></div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top spacer / could host HUD */}
        <header className="h-8 px-4 flex items-center justify-end text-[9px] text-slate-500 border-b border-slate-900/60">
          <span>Pilot&apos;s HUD · Mesh: {meshId}</span>
        </header>
        <FederationHeader />
        <FederationStatusBar />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};
