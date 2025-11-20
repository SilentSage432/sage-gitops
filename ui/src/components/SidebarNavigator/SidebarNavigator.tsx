import React from 'react';
import { cn } from '@/utils/cn';

interface SidebarNavigatorProps {
  selectedItem?: string;
  onSelectItem?: (item: string) => void;
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
  onSelectItem
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
        { id: 'arc-chi', label: 'Chi', symbol: 'Χ' }
      ]
    },
    {
      title: 'Federation',
      items: [
        { id: 'pi-kluster', label: 'Pi Kluster' },
        { id: 'onboarding-nexus', label: 'Onboarding Nexus' },
        { id: 'nodes', label: 'Nodes' }
      ]
    },
    {
      title: 'Agents',
      items: [{ id: 'agents', label: 'Agents Overview' }]
    },
    {
      title: 'Operator',
      items: [
        { id: 'tools', label: 'Operator Tools' },
        { id: 'operator-terminal', label: 'Operator Terminal', symbol: '⌘' }
      ]
    }
  ];

  const handleClick = (itemId: string) => {
    onSelectItem?.(itemId);
  };

  return (
    <aside className="h-full bg-[#0d0d12] border-r border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-wide text-slate-100">
          SAGE
        </h1>
        <p className="text-xs text-slate-500 mt-1">Operator Bridge</p>
      </div>

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

