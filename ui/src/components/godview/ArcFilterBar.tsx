// 🔍 Arc Filter Bar Component
// Filter topology by arc/domain with multi-select support

import React, { useState, useEffect } from 'react';
import { getActiveArcs, isAllArcsActive, toggleArc, resetArcsToAll, getNormalizedTopology, subscribe } from '../../stores/godviewStore';

interface ArcFilterBarProps {
  className?: string;
}

export const ArcFilterBar: React.FC<ArcFilterBarProps> = ({ className = '' }) => {
  const [activeArcs, setActiveArcs] = useState<string[]>(() => getActiveArcs());
  const [allActive, setAllActive] = useState<boolean>(() => isAllArcsActive());
  const [normalized, setNormalized] = useState(() => getNormalizedTopology());

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setActiveArcs(getActiveArcs());
      setAllActive(isAllArcsActive());
      setNormalized(getNormalizedTopology());
    });
    return unsubscribe;
  }, []);

  // Get arcs from normalized topology, with fallback defaults
  const defaultArcs = ['Chi', 'Lambda', 'Omega', 'Rho2', 'Rho²', 'Sigma', 'Psi', 'UI', 'Core'];
  const arcs = normalized && normalized.arcs && normalized.arcs.length > 0
    ? normalized.arcs
    : defaultArcs;

  // Normalize arc names for display (remove prefixes like "arc-" and split on "–" or "-")
  const normalizeArcNameForDisplay = (arc: string): string => {
    let name = arc;
    // Remove "arc-" prefix if present
    if (name.toLowerCase().startsWith('arc-')) {
      name = name.substring(4);
    }
    // Extract first part before "–" or "-"
    const parts = name.split(/[–\-]/);
    name = parts[0].trim();
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Keep original arc names for matching, but display normalized
  const arcMap = new Map<string, string>(); // original -> display name
  arcs.forEach(arc => {
    const displayName = normalizeArcNameForDisplay(arc);
    arcMap.set(arc, displayName);
  });

  // Get unique display names and their original mappings
  const uniqueDisplayArcs = Array.from(new Set(arcMap.values())).sort();
  const displayToOriginal = new Map<string, string>();
  arcMap.forEach((display, original) => {
    if (!displayToOriginal.has(display)) {
      displayToOriginal.set(display, original);
    }
  });

  const handleArcClick = (arc: string) => {
    toggleArc(arc);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
        Filter:
      </div>
      
      {/* All filter */}
      <button
        onClick={() => handleArcClick('ALL')}
        disabled={!allActive && activeArcs.length > 0}
        className={`px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
          allActive
            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 cursor-pointer'
            : 'border-slate-800 bg-slate-950/50 text-slate-500 cursor-not-allowed opacity-50'
        }`}
      >
        All
      </button>

      {/* Arc filters */}
      {uniqueDisplayArcs.map((displayArc) => {
        const originalArc = displayToOriginal.get(displayArc) || displayArc;
        // Check if original arc is in activeArcs (match by exact name or display name)
        const isSelected = !allActive && (activeArcs.includes(originalArc) || activeArcs.includes(displayArc));
        const isDisabled = allActive;
        
        return (
          <button
            key={displayArc}
            onClick={() => handleArcClick(originalArc)}
            disabled={isDisabled}
            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
              isSelected
                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 cursor-pointer'
                : isDisabled
                ? 'border-slate-800 bg-slate-950/50 text-slate-500 cursor-not-allowed opacity-50'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-950/70 hover:text-slate-300 cursor-pointer'
            }`}
          >
            {displayArc}
          </button>
        );
      })}
    </div>
  );
};

