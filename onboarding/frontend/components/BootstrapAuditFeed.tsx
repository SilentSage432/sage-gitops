'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface AuditEvent {
  id: string;
  tenantId: string;
  action: 'KIT_GENERATED' | 'KIT_DOWNLOADED' | 'VERIFY_SUCCESS' | 'VERIFY_FAILED';
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface BootstrapAuditFeedProps {
  tenantId: string | null;
}

export function BootstrapAuditFeed({ tenantId }: BootstrapAuditFeedProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditEvents = useCallback(async () => {
    if (!tenantId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const octToken = localStorage.getItem('oct-storage')
        ? JSON.parse(localStorage.getItem('oct-storage')!).token
        : '';

      const response = await fetch(`${API_BASE_URL}/api/onboarding/bootstrap/audit/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${octToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit log: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAuditEvents();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAuditEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchAuditEvents]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'KIT_GENERATED':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Generated</Badge>;
      case 'KIT_DOWNLOADED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Downloaded</Badge>;
      case 'VERIFY_SUCCESS':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Verified</Badge>;
      case 'VERIFY_FAILED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const formatFingerprint = (fp?: string) => {
    if (!fp) return '';
    if (fp.startsWith('sha256:')) {
      return fp.substring(7, 23) + '...';
    }
    return fp.substring(0, 16) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bootstrap Kit Audit Log</CardTitle>
          <button
            onClick={fetchAuditEvents}
            disabled={isLoading}
            className="p-1 hover:bg-white/5 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {isLoading && events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-white/60">Loading audit log...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-white/60">No bootstrap activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-[#1a1d22] border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(event.action)}
                      <span className="text-xs text-white/40 font-mono">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    {event.fingerprint && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Fingerprint:</span>
                        <code className="text-xs font-mono text-white/80 bg-[#0b0c0f] px-2 py-1 rounded">
                          {formatFingerprint(event.fingerprint)}
                        </code>
                      </div>
                    )}

                    {event.ipAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">IP:</span>
                        <span className="text-white/80 font-mono text-xs">{event.ipAddress}</span>
                      </div>
                    )}

                    {event.userAgent && (
                      <div className="text-xs text-white/50 mt-2 truncate" title={event.userAgent}>
                        {event.userAgent.length > 60 ? event.userAgent.substring(0, 60) + '...' : event.userAgent}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

