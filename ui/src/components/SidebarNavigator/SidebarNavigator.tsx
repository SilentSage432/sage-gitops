import React from 'react';
import { cn } from '@/utils/cn';

interface SidebarNavigatorProps {
  selectedItem?: string;
  onSelectItem?: (item: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

interface NavSection {
  title: string;
  items: Array<{
    id: string;
    label: string;
    symbol?: string;
  }>;
}

/**
 * SidebarNavigator – Federation navigation into Arcs, Federation, Agents, Tools
 */
export const SidebarNavigator: React.FC<SidebarNavigatorProps> = ({
  selectedItem,
  onSelectItem,
  onClose,
  isOpen = false,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Bridge',
      items: [{ id: 'home', label: 'Bridge Home' }]
    },
    {
      title: 'Arcs',
      items: [
        { id: 'arc-theta', label: 'Theta', symbol: 'Θ' },
        { id: 'arc-sigma', label: 'Sigma', symbol: 'Σ' },
        { id: 'arc-omega', label: 'Omega', symbol: 'Ω' },
        { id: 'arc-rho2', label: 'Rho²', symbol: 'ρ²' },
        { id: 'arc-lambda', label: 'Lambda', symbol: 'Λ' },
        { id: 'arc-chi', label: 'Chi', symbol: 'Χ' },
        { id: 'arc-xi', label: 'Xi', symbol: 'Ξ' },
        { id: 'arc-mu', label: 'Mu', symbol: 'Μ' },
        { id: 'arc-nu', label: 'Nu', symbol: 'Ν' },
        { id: 'arc-omicron', label: 'Omicron', symbol: 'Ο' },
        { id: 'arc-zeta', label: 'Zeta', symbol: 'Ζ' },
        { id: 'arc-iota', label: 'Iota', symbol: 'Ι' },
        { id: 'arc-epsilon', label: 'Epsilon', symbol: 'Ε' },
        { id: 'arc-delta', label: 'Delta', symbol: 'Δ' }
      ]
    },
    {
      title: 'Federation',
      items: [
        { id: 'federation-backplane', label: 'Federation Backplane' },
        { id: 'federation-state', label: 'Federation State' },
        { id: 'topology', label: 'Topology' },
        { id: 'pi-kluster', label: 'Pi Kluster' },
        { id: 'onboarding-nexus', label: 'Onboarding Nexus' },
        { id: 'nodes', label: 'Nodes' },
        { id: 'federation-health', label: 'Federation Health' },
        { id: 'mesh-telemetry', label: 'Mesh Telemetry' },
        { id: 'signal-history', label: 'Signal History' },
        { id: 'federation-alerts', label: 'Alerts' },
        { id: 'federation-logs', label: 'Federation Logs' }
      ]
    },
    {
      title: 'Agents',
      items: [
        { id: 'agents', label: 'Agents Overview', symbol: '♟' },
        { id: 'agent-genesis', label: 'Agent Genesis', symbol: '⚡' },
        { id: 'agent-library', label: 'Agent Library', symbol: '📚' }
      ]
    },
    {
      title: 'Cognition',
      items: [
        { id: 'cognition', label: 'Cognition Stream' }
      ]
    }
  ];

  const handleClick = (itemId: string) => {
    onSelectItem?.(itemId);
  };

  return (
    <aside className="federation-left-nav sage-sidebar h-full bg-[#0d0d12] border-r border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-slate-100">
            SAGE Federation
          </h1>
          <p className="text-xs text-slate-500 mt-1">Navigation</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wide text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>
      <span className={`text-[10px] uppercase tracking-[0.3em] ${isOpen ? "text-emerald-400" : "text-slate-500"}`}>
        {isOpen ? "Panel Open" : "Panel Closed"}
      </span>

      {navSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {section.title}
          </h2>
          {section.items.map((item) => {
            const isSelected = selectedItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded transition-all duration-200',
                  'hover:bg-slate-800/50',
                  isSelected
                    ? 'bg-purple-600/30 text-purple-300 border-l-2 border-purple-400'
                    : 'text-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  {item.symbol && (
                    <span className="text-sm font-mono">{item.symbol}</span>
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

