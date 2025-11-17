import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { 
  getSummary, 
  getEvents, 
  getAnomalies, 
  isLoading, 
  getError, 
  refreshAll, 
  subscribe as subscribeSignals,
  getSeverityFilter,
  getTimeWindow,
  getFilteredEvents,
  setSeverityFilter,
  setTimeWindow,
  type SeverityFilter,
  type TimeWindow,
} from '../stores/signalsStore';
import { getDependencies, subscribe as subscribeHeartbeat } from '../stores/heartbeatStore';
import { DependencyMatrix } from '../components/DependencyMatrix';
import { cn } from '../utils/cn';

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function getLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
    case 'error':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'warn':
    case 'warning':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    case 'info':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    default:
      return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'warning':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    default:
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  }
}

export function Signals() {
  const [summary, setSummary] = useState(() => getSummary());
  const [events, setEvents] = useState(() => getEvents());
  const [anomalies, setAnomalies] = useState(() => getAnomalies());
  const [loading, setLoading] = useState(() => isLoading());
  const [error, setError] = useState(() => getError());
  const [dependencies, setDependencies] = useState(() => getDependencies());
  const [severityFilter, setSeverityFilterState] = useState(() => getSeverityFilter());
  const [timeWindow, setTimeWindowState] = useState(() => getTimeWindow());
  const [filteredEvents, setFilteredEvents] = useState(() => getFilteredEvents());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to signals store
  useEffect(() => {
    const unsubscribe = subscribeSignals(() => {
      setSummary(getSummary());
      setEvents(getEvents());
      setAnomalies(getAnomalies());
      setLoading(isLoading());
      setError(getError());
      setSeverityFilterState(getSeverityFilter());
      setTimeWindowState(getTimeWindow());
      setFilteredEvents(getFilteredEvents());
    });

    return unsubscribe;
  }, []);

  // Subscribe to heartbeat for dependencies
  useEffect(() => {
    const unsubscribe = subscribeHeartbeat(() => {
      setDependencies(getDependencies());
    });

    return unsubscribe;
  }, []);

  // Initial load and smarter polling
  useEffect(() => {
    const signalsDep = dependencies?.signals;
    const status = signalsDep?.status ?? 'unknown';
    
    // Only auto-refresh if signals dependency is not offline
    if (status !== 'offline') {
      refreshAll();
    }

    // Set up polling based on dependency status
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status !== 'offline') {
      // Degraded: 60s, Healthy/Unknown: 30s
      const pollInterval = status === 'degraded' ? 60000 : 30000;
      
      interval = setInterval(() => {
        refreshAll();
      }, pollInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dependencies?.signals?.status]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const signalsDep = dependencies?.signals;
  const signalsStatus = signalsDep?.status ?? 'unknown';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Signals</h1>
        <p className="text-xs text-slate-400">
          Federation signal stream and anomaly detection.
        </p>
      </div>

      {/* Dependency Matrix */}
      <div className="flex items-center justify-between">
        <DependencyMatrix deps={dependencies} />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        {/* Severity Filter Chips */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          {(['all', 'info', 'warn', 'error'] as SeverityFilter[]).map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(level)}
              className={cn(
                'px-2 py-1 rounded text-[10px] font-semibold border transition-all',
                severityFilter === level
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700/50'
              )}
            >
              {level === 'all' ? 'All' : level === 'error' ? 'Error/Critical' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Time:</span>
          {(['1h', '6h', '24h', 'all'] as TimeWindow[]).map((window) => (
            <button
              key={window}
              onClick={() => setTimeWindow(window)}
              className={cn(
                'px-2 py-1 rounded text-[10px] font-semibold border transition-all',
                timeWindow === window
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700/50'
              )}
            >
              {window === 'all' ? 'All' : window}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className={cn(
              'px-3 py-1 rounded text-xs font-semibold border transition-all',
              'bg-slate-800/50 text-slate-300 border-slate-700',
              'hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Signals offline banner */}
      {signalsStatus === 'offline' && (
        <Card className="p-3 border-red-500/30 bg-red-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="text-xs font-semibold text-red-300">
              Signal stream offline
            </div>
          </div>
        </Card>
      )}

      {/* Signals degraded warning */}
      {signalsStatus === 'degraded' && (
        <Card className="p-3 border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="text-xs font-semibold text-amber-300">
              Signal stream degraded; data may be delayed or partially stale.
            </div>
          </div>
        </Card>
      )}

      {/* Error hint (if not offline) */}
      {error && signalsStatus !== 'offline' && (
        <Card className="p-2 border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
          <div className="text-xs text-amber-400">
            Failed to refresh signals. Data may be stale.
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-slate-800 bg-slate-900/70 backdrop-blur-sm">
          <div className="text-xs opacity-60 mb-1">Events (24h)</div>
          <div className="text-lg font-semibold text-slate-200">
            {summary.totalEvents24h ?? '—'}
          </div>
        </Card>
        <Card className="p-3 border-slate-800 bg-slate-900/70 backdrop-blur-sm">
          <div className="text-xs opacity-60 mb-1">Anomalies (24h)</div>
          <div className="text-lg font-semibold text-slate-200">
            {summary.anomalies24h ?? '—'}
          </div>
        </Card>
        <Card className="p-3 border-slate-800 bg-slate-900/70 backdrop-blur-sm">
          <div className="text-xs opacity-60 mb-1">Warnings Open</div>
          <div className={`text-lg font-semibold ${
            (summary.warningOpen ?? 0) > 0 ? 'text-amber-400' : 'text-slate-200'
          }`}>
            {summary.warningOpen ?? '—'}
          </div>
        </Card>
        <Card className="p-3 border-slate-800 bg-slate-900/70 backdrop-blur-sm">
          <div className="text-xs opacity-60 mb-1">Critical Open</div>
          <div className={`text-lg font-semibold ${
            (summary.criticalOpen ?? 0) > 0 ? 'text-red-400' : 'text-slate-200'
          }`}>
            {summary.criticalOpen ?? '—'}
          </div>
        </Card>
      </div>

      {/* Zero-state for offline */}
      {signalsStatus === 'offline' && (
        <Card className="p-12 text-center border-slate-800 bg-slate-900/50">
          <div className="max-w-md mx-auto space-y-3">
            <div className="text-lg font-semibold text-slate-200">
              Signal stream offline
            </div>
            <div className="text-sm text-slate-400">
              SAGE cannot reach the federation signal channel right now.
            </div>
            {signalsDep?.reason && (
              <div className="text-xs text-slate-500 mt-2">
                {signalsDep.reason}
              </div>
            )}
            <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800">
              Once connectivity is restored, signal data will populate automatically.
            </div>
            <button
              onClick={() => refreshAll()}
              className="mt-4 px-3 py-1 text-xs bg-slate-800/50 border border-slate-700 rounded hover:bg-slate-700/50 text-slate-300"
            >
              Try Refresh
            </button>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && signalsStatus !== 'offline' && events.length === 0 && (
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            <div className="text-xs opacity-70">Listening to federation signals…</div>
          </div>
        </Card>
      )}

      {/* Recent Events List */}
      {signalsStatus !== 'offline' && (
        <>
          <Card className="p-0 overflow-auto border-slate-800 bg-slate-900/70 backdrop-blur-sm">
            <div className="p-3 border-b border-slate-800">
              <div className="text-xs font-semibold text-slate-100">Recent Events</div>
            </div>
            {filteredEvents.length === 0 && !loading ? (
              <div className="p-6 text-center text-sm text-slate-400">
                {events.length === 0
                  ? 'No recent events from the federation.'
                  : 'No events match the current filters.'}
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-slate-400">Time</th>
                    <th className="text-left px-3 py-2 text-xs text-slate-400">Level</th>
                    <th className="text-left px-3 py-2 text-xs text-slate-400">Source</th>
                    <th className="text-left px-3 py-2 text-xs text-slate-400">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 50).map((event) => (
                    <tr
                      key={event.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-3 py-2 text-xs text-slate-400 font-mono">
                        {formatTime(event.ts)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', getLevelColor(event.level))}>
                          {event.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {event.source}
                        {event.cluster && (
                          <span className="text-slate-500 ml-1">({event.cluster})</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-200">
                        <span
                          className="truncate block max-w-md"
                          title={event.message}
                        >
                          {event.message}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Anomalies Section */}
          <Card className="p-4 border-slate-800 bg-slate-900/70 backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-100 mb-3">Anomalies</div>
            {anomalies.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                No current anomalies
              </div>
            ) : (
              <div className="space-y-2">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="rounded border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', getSeverityColor(anomaly.severity))}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-300">{anomaly.source}</span>
                        {anomaly.cluster && (
                          <span className="text-xs text-slate-500">({anomaly.cluster})</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatTime(anomaly.ts)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 mb-1">{anomaly.summary}</div>
                    <div className="text-[10px] text-slate-500">
                      Status: <span className="text-slate-400">{anomaly.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
