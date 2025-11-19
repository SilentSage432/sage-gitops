import React, { useState } from 'react';
import { BridgeFrame } from '../layout/BridgeFrame';
import { ArcThetaPanel } from '../features/arc/ArcThetaPanel';
import { ArcSigmaPanel } from '../features/arc/ArcSigmaPanel';
import { ArcOmegaPanel } from '../features/arc/ArcOmegaPanel';
import { ArcRho2Lodge } from '../features/arc/ArcRho2Lodge';
import { ArcLambdaPanel } from '../features/arc/ArcLambdaPanel';
import { ArcChiPanel } from '../features/arc/ArcChiPanel';
import { PiClusterChamber } from '../features/federation/PiClusterChamber';
import { OnboardingNexus } from '../features/federation/OnboardingNexus';
import { NodesView } from '../features/federation/NodesView';
import { AgentsOverview } from '../features/agents/AgentsOverview';
import { AgentDetails } from '../features/agents/AgentDetails';
import { WhispererTerminal } from '../components/WhispererTerminal/WhispererTerminal';
import { OperatorTerminal } from "../features/operator/OperatorTerminal";

/**
 * App – Root component that wires the Bridge Frame
 */
export const App: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string>('home');

  const renderActiveChamber = () => {
    switch (selectedItem) {
      case 'home':
        return null; // No panel for home
      
      // Arc panels
      case 'arc-theta':
        return <ArcThetaPanel />;
      case 'arc-sigma':
        return <ArcSigmaPanel />;
      case 'arc-omega':
        return <ArcOmegaPanel />;
      case 'arc-rho2':
        return <ArcRho2Lodge />;
      case 'arc-lambda':
        return <ArcLambdaPanel />;
      case 'arc-chi':
        return <ArcChiPanel />;
      
      // Federation panels
      case 'pi-kluster':
        return <PiClusterChamber />;
      case 'onboarding-nexus':
        return <OnboardingNexus />;
      case 'nodes':
        return <NodesView />;
      
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
        return <OperatorTerminal />;
      
      default:
        return null;
    }
  };

  return (
    <BridgeFrame
      activeChamber={renderActiveChamber()}
      centerConsole={<WhispererTerminal />}
      selectedItem={selectedItem}
      onSelectItem={setSelectedItem}
    />
  );
};

export default App;
