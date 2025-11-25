import React, { useState, useEffect } from 'react';
import BridgeFrame from '../layout/BridgeFrame';
import { startMockAlerts } from "../core/alert/mockStream";
import { OperatorEffectProvider } from "../core/OperatorEffectContext";
import { TelemetryFilterProvider } from "../core/filters/useTelemetryFilter";
import { HybridModeProvider } from "../sage/hybrid/HybridModeContext";
import { UIShockwaveProvider } from "../core/UIShockwaveContext";
import { UIPulseProvider } from "../core/UIPulseContext";
import { ArcThetaPanel } from '../features/arc/ArcThetaPanel';
import { ArcSigmaPanel } from '../features/arc/ArcSigmaPanel';
import { ArcOmegaPanel } from '../features/arc/ArcOmegaPanel';
import { ArcRho2Lodge } from '../features/arc/ArcRho2Lodge';
import { ArcLambdaPanel } from '../features/arc/ArcLambdaPanel';
import { ArcChiPanel } from '../features/arc/ArcChiPanel';
import { PiClusterChamber } from '../features/federation/PiClusterChamber';
import { OnboardingNexus } from '../features/federation/OnboardingNexus';
import { NodesView } from '../features/federation/NodesView';
import { FederationHealthCore } from '../features/federation/FederationHealthCore';
import { FederationHealthMatrix } from '../features/federation/FederationHealthMatrix';
import { MeshTelemetrySurface } from '../features/federation/MeshTelemetrySurface';
import { SignalHistoryPanel } from '../features/federation/SignalHistoryPanel';
import { FederationAlertsPanel } from '../features/federation/FederationAlertsPanel';
import { NodeDetailsPanel } from '../features/federation/NodeDetailsPanel';
import { AgentsOverview } from '../features/agents/AgentsOverview';
import { AgentDetails } from '../features/agents/AgentDetails';
import OperatorTerminal from "../features/operator/OperatorTerminal";
import CognitionPanel from "../features/cognition/CognitionPanel";

/**
 * App – Root component that wires the Bridge Frame
 */
export const App: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string>('home');

  // ✅ Start mock alert stream in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      startMockAlerts();
    }
  }, []);

  const renderActiveChamber = () => {
    switch (selectedItem) {
      case 'home':
        return null; // No panel for home
      
      // Arc panels
      case 'arc-theta':
        return <ArcThetaPanel key="arc-theta" />;
      case 'arc-sigma':
        return <ArcSigmaPanel key="arc-sigma" />;
      case 'arc-omega':
        return <ArcOmegaPanel key="arc-omega" />;
      case 'arc-rho2':
        return <ArcRho2Lodge />;
      case 'arc-lambda':
        return <ArcLambdaPanel key="arc-lambda" />;
      case 'arc-chi':
        return <ArcChiPanel key="arc-chi" />;
      
      // Federation panels
      case 'pi-kluster':
        return <PiClusterChamber key="pi-kluster" onSelect={(nodeId) => setSelectedItem(`node:${nodeId}`)} />;
      case 'onboarding-nexus':
        return <OnboardingNexus />;
      case 'nodes':
        return <NodesView />;
      case "federation-health":
        return <FederationHealthMatrix />;
      case "mesh-telemetry":
        return <MeshTelemetrySurface />;
      case 'signal-history':
        return <SignalHistoryPanel />;
      case 'federation-alerts':
        return <FederationAlertsPanel />;
      
      // Agents panels
      case 'agents':
        return <AgentsOverview />;
      case 'tools':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Operator Tools
            </h2>
            <p className="text-sm text-slate-400">
              Operator tools shell
            </p>
            <div className="mt-8 p-6 bg-slate-900/50 rounded border border-slate-800">
              <p className="text-slate-500 text-sm">Placeholder for operator tools...</p>
            </div>
          </div>
        );
      
      case "operator-terminal":
        return null; // Terminal is now always shown in main area, not in drawer
      
      case "cognition":
        return <CognitionPanel />;
      
      // Node details - handle node: prefix
      default:
        if (selectedItem?.startsWith('node:')) {
          return <NodeDetailsPanel nodeId={selectedItem.replace('node:', '')} onBack={() => setSelectedItem('pi-kluster')} />;
        }
        return null;
    }
  };

  return (
    <OperatorEffectProvider>
      <HybridModeProvider>
        <TelemetryFilterProvider>
          <UIShockwaveProvider>
            <UIPulseProvider>
              <BridgeFrame
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                activeChamber={renderActiveChamber()}
              />
            </UIPulseProvider>
          </UIShockwaveProvider>
        </TelemetryFilterProvider>
      </HybridModeProvider>
    </OperatorEffectProvider>
  );
};

export default App;
