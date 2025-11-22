import React, { useEffect } from "react";
import { SidebarNavigator } from "../components/SidebarNavigator/SidebarNavigator";
import { WhispererTerminal } from "../components/WhispererTerminal/WhispererTerminal";
import { StatusBar } from "../components/StatusBar/StatusBar";
import { useOperatorEffect } from "../core/OperatorEffectContext";
import { useHybridAutonomy } from "../sage/hybrid/useHybridAutonomy";
import { useUIAlertsBridge } from "../core/useUIAlertsBridge";
import { PredictiveOverlay } from "../sage/predictive/ui/PredictiveOverlay";
import { usePredictiveWS } from "../sage/predictive/ws/usePredictiveWS";
import { useUIShockwave } from "../core/UIShockwaveContext";
import { useKernelHeartbeat } from "../core/hooks/useKernelHeartbeat";
import { useKernelSignal } from "../sage/kernel/useKernelSignal";
import { useReflex } from "../sage/kernel/useReflex";
import { useHeartbeat } from "../sage/kernel/useHeartbeat";
import { startKernelPulse } from "../sage/kernel/KernelPulse";
import { subscribeKernel } from "../sage/kernel/KernelSignalBus";
import { useENFL } from "../sage/enfl/useENFL";
import useOperatorCortex from "../core/OperatorCortex";
import useAutoSurface from "../core/AutoSurfaceEngine";
import useAwarenessMatrix from "../core/awareness/AwarenessMatrix";
import useAutonomicSafeguard from "../core/safeguards/useAutonomicSafeguard";
import useSelfHealingLoop from "../core/recovery/useSelfHealingLoop";
import { useStabilityForecast } from "../sage/cognition/useStabilityForecast";
import { ForecastHUD } from "../components/ForecastHUD/ForecastHUD";
import "../components/ForecastHUD/ForecastHUD.css";
import "../styles/ui-alerts.css";

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
  const cortex = useOperatorCortex(selectedItem);
  const awareness = useAwarenessMatrix();
  const errorSignal = awareness === "ALERT";
  useAutonomicSafeguard(awareness);
  useSelfHealingLoop(errorSignal);
  useStabilityForecast();
  useAutoSurface(cortex.isOperatorActive);
  useHybridAutonomy();
  useUIAlertsBridge();
  useKernelHeartbeat();
  usePredictiveWS();
  useENFL(); // enables emergent responsiveness

  useEffect(() => {
    startKernelPulse();
  }, []);

  useReflex();
  useHeartbeat();

  const kernelPulse = useKernelSignal("kernel.pulse");
  const kernelWarning = useKernelSignal("kernel.warning");
  const reflexFlash = useKernelSignal("kernel.flash");
  const hb = useKernelSignal("kernel.pulse.ui");

  const alertState = useUIShockwave().state;

  const alertClass =
    alertState.level === "critical"
      ? "UI-critical-shockwave"
      : alertState.level === "warning" && alertState.burst
      ? "UI-warning-pulse"
      : "";

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
        cortex.registerCommand();
      }
      if (action === "ui.surface.panel") {
        const { panel } = payload;
        onSelectItem?.(panel);
      }
    }

    window.addEventListener("SAGE_UI_ACTION", onAction as EventListener);
    return () =>
      window.removeEventListener("SAGE_UI_ACTION", onAction as EventListener);
  }, [onSelectItem, cortex]);

  // Kernel focus arc listener
  useEffect(() => {
    const unsub = subscribeKernel("kernel.focus.arc", (payload) => {
      onSelectItem?.(`arc-${payload.arc}`);
    });
    return unsub;
  }, [onSelectItem]);

  return (
    <div
      className={`
        relative flex h-screen w-screen bg-[#030304] text-white overflow-hidden flex-col
        transition-all duration-700
        ${state.flash ? "ring-4 ring-purple-500" : ""}
        ${alertClass}
        ${kernelPulse ? "ring-1 ring-purple-600/20" : ""}
        ${kernelWarning ? "bg-[#12030a]" : ""}
        ${reflexFlash ? `animate-[reflexFlash_0.8s_ease-out]` : ""}
        ${hb ? "animate-[uiPulse_1.2s_ease-in-out]" : ""}
        ${awareness === "ELEVATED" ? "ring-2 ring-yellow-500" : ""}
        ${awareness === "ALERT" ? "ring-4 ring-red-500" : ""}
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

      <PredictiveOverlay />

      {/* Bottom Status Bar */}
      <div className="h-12 flex-shrink-0 border-t border-slate-800">
        <StatusBar />
      </div>

      <ForecastHUD />
    </div>
  );
};

