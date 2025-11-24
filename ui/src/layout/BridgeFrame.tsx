import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { OperatorTerminal } from "../components/OperatorTerminal";
import { OperatorInput } from "../components/OperatorInput";
import { SidebarNavigator } from "../components/SidebarNavigator/SidebarNavigator";

export const BridgeFrame: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState<string>();

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSelectItem = useCallback(
    (itemId: string) => {
      setSelectedNavItem(itemId);
      setSidebarOpen(false);
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white relative flex flex-col">
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={handleToggleSidebar}
        className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white hover:bg-black/60 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {/* PRIME Terminal — fixed center layout */}
      <div className="flex-1 flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OperatorTerminal />
        </div>
      </div>
      <OperatorInput />
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggleSidebar}
            />
            <motion.aside
              className="
                fixed top-0 left-0 h-full w-72
                bg-[#0b0b12] z-50
                border-r border-slate-800
                overflow-y-auto
              "
              initial={{ x: "-100%" }}
              animate={{ x: sidebarOpen ? 0 : "-100%" }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <SidebarNavigator
                selectedItem={selectedNavItem}
                onSelectItem={handleSelectItem}
                onClose={handleToggleSidebar}
                isOpen={sidebarOpen}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BridgeFrame;
