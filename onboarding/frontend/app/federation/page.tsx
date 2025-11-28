// Phase 16.6: Federation State Page for Onboarding UI
// Read-only federation state visibility for provisioning + federation verification
import FederationStatePanel from "@/components/FederationStatePanel";

export default function FederationStatePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <FederationStatePanel />
    </div>
  );
}

