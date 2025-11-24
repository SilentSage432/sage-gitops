'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Activity, Brain, Clock } from 'lucide-react';

interface PersonalMeshNodeProps {
  callsign?: string;
  nodeId: string;
}

// Generate UUIDv4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function PersonalMeshNode({ callsign, nodeId }: PersonalMeshNodeProps) {
  const [lastPulse, setLastPulse] = useState<Date>(new Date());

  // Update pulse timestamp every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastPulse(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5 text-violet-400" />
          Node Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {callsign && (
          <div>
            <p className="text-sm text-white/60">Callsign</p>
            <p className="text-sm font-medium text-[#e2e6ee] font-mono">{callsign}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-white/60">Node ID</p>
          <p className="text-sm font-medium text-[#e2e6ee] font-mono text-xs break-all">{nodeId}</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Mode</p>
          <p className="text-sm font-medium text-[#e2e6ee]">Personal Mesh Node</p>
        </div>
        <div>
          <p className="text-sm text-white/60">Status</p>
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Standby
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveStatusPanel() {
  const [lastPulse, setLastPulse] = useState<Date>(new Date());

  // Update pulse timestamp every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastPulse(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-violet-400" />
          Live Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Mesh Reachability</span>
          <Badge variant="secondary" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
            OK
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Heartbeat Sync</span>
          <Badge variant="secondary" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
            Active
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Cognitive Link</span>
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Initializing
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-sm text-white/60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Pulse
          </span>
          <span className="text-xs font-mono text-white/80">{formatTime(lastPulse)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { generateUUID };

