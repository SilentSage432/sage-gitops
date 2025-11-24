import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { OperatorTerminal } from "../components/OperatorTerminal";
import { OperatorInput } from "../components/OperatorInput";
import { SidebarNavigator } from "../components/SidebarNavigator/SidebarNavigator";
import { useUIShockwave } from "../core/UIShockwaveContext";
import Rho2Panel from "../panels/Rho2Panel";
import NodesPanel from "../panels/NodesPanel";
import AgentsPanel from "../panels/AgentsPanel";
import CognitionPanel from "../panels/CognitionPanel";
import OnboardingNexusPanel from "../panels/OnboardingNexusPanel";

interface BridgeFrameProps {
  selectedItem?: string;
  onSelectItem?: (item?: string) => void;
}

export const BridgeFrame: React.FC<BridgeFrameProps> = ({
  selectedItem,
  onSelectItem,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const alertState = useUIShockwave().state;
  console.log("🎯 ACTIVE SELECTED ITEM:", selectedItem);

  const alertClass =
    alertState.level === "critical"
      ? "UI-critical-shockwave"
      : alertState.level === "warning" && alertState.burst
      ? "UI-warning-pulse"
      : "";

  // ✅ ESC closes right panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem) {
        onSelectItem?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedItem, onSelectItem]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleSelectItem = useCallback((itemId: string) => {
    console.log("✅ SIDEBAR CLICK FIRED:", itemId);
    onSelectItem?.(itemId);
    setSidebarOpen(false);
  }, [onSelectItem]);

  const panelRegistry: Record<string, React.ReactNode> = {
    "arc-rho2": <Rho2Panel />,
    nodes: <NodesPanel />,
    agents: <AgentsPanel />,
    cognition: <CognitionPanel />,
    "onboarding-nexus": <OnboardingNexusPanel />,
  };

  const activePanel = selectedItem ? panelRegistry[selectedItem] : null;

  return (
    <div
      className={`
        relative h-screen w-screen flex flex-col text-white overflow-hidden
        sage-ui-surface transition-all duration-300
        ${alertClass}
      `}
      style={{ paddingBottom: "80px" }}
    >
      <div className="sage-surface flex flex-1 overflow-hidden min-h-0 relative">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Overlay */}
        <motion.aside
          className="
            fixed top-0 left-0 h-full w-72
            bg-[#0b0b12] z-50
            border-r border-slate-800
            overflow-y-auto
          "
          initial={{ x: "-100%" }}
          animate={{ x: sidebarOpen ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <SidebarNavigator
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onClose={() => setSidebarOpen(false)}
            isOpen={sidebarOpen}
          />
        </motion.aside>

        {/* ✅ R-C PRIME — STATIC TWO-PANE LAYOUT */}
        <div className="flex w-full h-full">
          {/* LEFT: Terminal — NEVER MOVES */}
          <div className="flex-1 min-w-0 px-8 py-10 overflow-hidden">
            <div
              className="max-w-5xl mx-auto h-full bg-[#0d0d12] rounded-2xl border border-[#2a2a40]
            shadow-[0_0_30px_rgba(96,0,255,0.18)] overflow-hidden flex flex-col"
            >
              <OperatorTerminal />
            </div>
          </div>

          {/* RIGHT: ACTIVE PANEL — ALWAYS VISIBLE WHEN SET */}
          {activePanel && (
            <div
              key={selectedItem}
              className="w-[420px] flex-shrink-0 h-full border-l border-slate-800 bg-[#0c0c13]/95
              backdrop-blur-xl shadow-2xl overflow-y-auto"
            >
              {activePanel}
            </div>
          )}
        </div>
      </div>

      <OperatorInput />

      <button
        onClick={handleToggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[#181824] hover:bg-[#222233]
        transition border border-slate-700 flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-slate-300" />
      </button>
    </div>
  );
};

export default BridgeFrame;
