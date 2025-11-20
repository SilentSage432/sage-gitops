import React, { useEffect } from 'react';
import { SidebarNavigator } from '../components/SidebarNavigator/SidebarNavigator';
import { WhispererTerminal } from '../components/WhispererTerminal/WhispererTerminal';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { useOperatorEffect } from "../core/OperatorEffectContext";
import { useHybridAutonomy } from "../sage/hybrid/useHybridAutonomy";

interface BridgeFrameProps {
  activeChamber?: React.ReactNode;
  selectedItem?: string;
  onSelectItem?: (item: string) => void;
}

/**
 * BridgeFrame – The core Operator Bridge layout
 * Contains: Left Navigator, Center Whisperer, Right Chamber, Bottom Status Bar
 */
export const BridgeFrame: React.FC<BridgeFrameProps> = ({ 
  activeChamber, 
  selectedItem,
  onSelectItem
}) => {
  const { state } = useOperatorEffect();
  useHybridAutonomy();

  // UI Action Dispatcher Listener
  useEffect(() => {
    function onAction(e: CustomEvent) {
      const { action, payload } = e.detail;

      if (action === "ui.focus.arc") {
        onSelectItem?.(`arc-${payload.arc}`);
      }
      if (action === "ui.focus.rho2") {
        onSelectItem?.("arc-rho2");
      }
      if (action === "ui.open.operator-terminal") {
        onSelectItem?.("operator-terminal");
      }
    }

    window.addEventListener("SAGE_UI_ACTION", onAction as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ACTION", onAction as EventListener);
  }, [onSelectItem]);

  return (
    <div
      className={`
        flex h-screen w-screen bg-[#030304] text-white overflow-hidden flex-col
        transition-all duration-500
        ${state.flash ? "ring-4 ring-purple-500" : ""}
      `}
    >
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar: Federation Navigator */}
        <div className="w-64 border-r border-slate-800 flex-shrink-0 overflow-y-auto">
          <SidebarNavigator selectedItem={selectedItem} onSelectItem={onSelectItem} />
        </div>

        {/* Center: Whisperer Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <WhispererTerminal />
        </div>

        {/* Right Panel: Active Chamber / Detail Panel */}
        {activeChamber && (
          <div
            className="
              w-96 border-l border-slate-800 flex-shrink-0
              flex flex-col min-h-0
            "
          >
            <div
              className="flex-1 overflow-y-auto p-6 min-h-0"
            >
              {activeChamber}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-12 flex-shrink-0 border-t border-slate-800">
        <StatusBar />
      </div>
    </div>
  );
};

