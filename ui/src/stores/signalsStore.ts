// 📡 Signals Store
// Manages federation signal data: summary, events, and anomalies

interface SignalSummary {
  totalEvents24h: number | null;
  anomalies24h: number | null;
  criticalOpen: number | null;
  warningOpen: number | null;
  lastEventAt: string | null;
}

interface SignalEvent {
  id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'critical' | string;
  source: string;
  cluster?: string;
  message: string;
}

interface SignalAnomaly {
  id: string;
  ts: string;
  severity: string;
  source: string;
  cluster?: string;
  summary: string;
  status: string;
}

type SeverityFilter = 'all' | 'info' | 'warn' | 'error' | 'critical';
type TimeWindow = '1h' | '6h' | '24h' | 'all';

interface SignalsState {
  summary: SignalSummary;
  events: SignalEvent[];
  anomalies: SignalAnomaly[];
  loading: boolean;
  error: string | null;
  severityFilter: SeverityFilter;
  timeWindow: TimeWindow;
}

let state: SignalsState = {
  summary: {
    totalEvents24h: null,
    anomalies24h: null,
    criticalOpen: null,
    warningOpen: null,
    lastEventAt: null,
  },
  events: [],
  anomalies: [],
  loading: false,
  error: null,
  severityFilter: 'all',
  timeWindow: '24h',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function getApiBase(): string {
  try {
    if (typeof (window as any).getApiBase === 'function') {
      return (window as any).getApiBase();
    }
    if ((window as any).SAGE_API_BASE) {
      return (window as any).SAGE_API_BASE.toString().replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return '/api';
}

export function getSummary(): SignalSummary {
  return state.summary;
}

export function getEvents(): SignalEvent[] {
  return state.events;
}

export function getAnomalies(): SignalAnomaly[] {
  return state.anomalies;
}

export function isLoading(): boolean {
  return state.loading;
}

export function getError(): string | null {
  return state.error;
}

export function getSeverityFilter(): SeverityFilter {
  return state.severityFilter;
}

export function getTimeWindow(): TimeWindow {
  return state.timeWindow;
}

export function setSeverityFilter(level: SeverityFilter): void {
  state.severityFilter = level;
  notify();
}

export function setTimeWindow(window: TimeWindow): void {
  state.timeWindow = window;
  notify();
}

export function getFilteredEvents(): SignalEvent[] {
  const { events, severityFilter, timeWindow } = state;
  const now = new Date();

  let filtered = [...events];

  // Apply severity filter
  if (severityFilter !== 'all') {
    filtered = filtered.filter((event) => {
      const level = (event.level || '').toLowerCase();
      if (severityFilter === 'error' || severityFilter === 'critical') {
        return level === 'error' || level === 'critical';
      }
      return level === severityFilter.toLowerCase();
    });
  }

  // Apply time window filter
  if (timeWindow !== 'all') {
    const hours = timeWindow === '1h' ? 1 : timeWindow === '6h' ? 6 : 24;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    filtered = filtered.filter((event) => {
      try {
        const eventTime = new Date(event.ts);
        if (isNaN(eventTime.getTime())) {
          return false; // Invalid date, exclude
        }
        return eventTime >= cutoff;
      } catch {
        return false; // Invalid date, exclude
      }
    });
  }

  return filtered;
}

export async function loadSummary(): Promise<void> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/signals/summary`, { credentials: 'omit' });
    
    if (!res.ok) {
      throw new Error(`Failed to load summary: ${res.status}`);
    }

    const data = await res.json();
    state.summary = {
      totalEvents24h: data.totalEvents24h ?? null,
      anomalies24h: data.anomalies24h ?? null,
      criticalOpen: data.criticalOpen ?? null,
      warningOpen: data.warningOpen ?? null,
      lastEventAt: data.lastEventAt ?? null,
    };
    state.error = null;
    notify();
  } catch (err: any) {
    state.error = err?.message || 'Failed to load signals summary';
    notify();
  }
}

export async function loadEvents(): Promise<void> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/signals/events`, { credentials: 'omit' });
    
    if (!res.ok) {
      throw new Error(`Failed to load events: ${res.status}`);
    }

    const data = await res.json();
    // Handle both array and object with items property
    const events = Array.isArray(data) ? data : (data.items || []);
    
    state.events = events.map((e: any) => ({
      id: e.id || `${e.ts}-${Math.random()}`,
      ts: e.ts || e.timestamp || new Date().toISOString(),
      level: e.level || e.severity || 'info',
      source: e.source || 'unknown',
      cluster: e.cluster,
      message: e.message || e.summary || '',
    }));
    state.error = null;
    notify();
  } catch (err: any) {
    state.error = err?.message || 'Failed to load signals events';
    notify();
  }
}

export async function loadAnomalies(): Promise<void> {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/signals/anomalies`, { credentials: 'omit' });
    
    if (!res.ok) {
      if (res.status === 404) {
        // Endpoint doesn't exist, that's okay
        state.anomalies = [];
        notify();
        return;
      }
      throw new Error(`Failed to load anomalies: ${res.status}`);
    }

    const data = await res.json();
    // Handle both array and object with items property
    const anomalies = Array.isArray(data) ? data : (data.items || []);
    
    state.anomalies = anomalies.map((a: any) => ({
      id: a.id || `${a.ts}-${Math.random()}`,
      ts: a.ts || a.timestamp || new Date().toISOString(),
      severity: a.severity || a.level || 'warning',
      source: a.source || 'unknown',
      cluster: a.cluster,
      summary: a.summary || a.message || '',
      status: a.status || 'open',
    }));
    state.error = null;
    notify();
  } catch (err: any) {
    // Don't treat 404 as fatal
    if (err?.message?.includes('404')) {
      state.anomalies = [];
      notify();
      return;
    }
    // For other errors, just log but don't block
    console.warn('[signalsStore] Failed to load anomalies:', err);
    state.anomalies = [];
    notify();
  }
}

export async function refreshAll(): Promise<void> {
  state.loading = true;
  state.error = null;
  notify();

  try {
    await Promise.all([
      loadSummary(),
      loadEvents(),
      loadAnomalies(),
    ]);
  } catch (err: any) {
    state.error = err?.message || 'Failed to refresh signals';
  } finally {
    state.loading = false;
    notify();
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

