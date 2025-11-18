import React from 'react';
import { SidebarNavigator } from '../components/SidebarNavigator/SidebarNavigator';
import { StatusBar } from '../components/StatusBar/StatusBar';

interface BridgeFrameProps {
  activeChamber?: React.ReactNode;
  centerConsole?: React.ReactNode;
  selectedItem?: string;
  onSelectItem?: (item: string) => void;
}

/**
 * BridgeFrame – The core Operator Bridge layout
 * Contains: Left Navigator, Center Whisperer, Right Chamber, Bottom Status Bar
 */
export const BridgeFrame: React.FC<BridgeFrameProps> = ({ 
  activeChamber, 
  centerConsole,
  selectedItem,
  onSelectItem
}) => {
  return (
    <div className="flex h-screen w-screen bg-[#030304] text-white overflow-hidden flex-col">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar: Federation Navigator */}
        <div className="w-64 border-r border-slate-800 flex-shrink-0 overflow-y-auto">
          <SidebarNavigator selectedItem={selectedItem} onSelectItem={onSelectItem} />
        </div>

        {/* Center: Whisperer Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {centerConsole}
        </div>

        {/* Right Panel: Active Chamber / Detail Panel */}
        {activeChamber && (
          <div className="w-96 border-l border-slate-800 flex-shrink-0 overflow-y-auto">
            <div className="p-6">
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

