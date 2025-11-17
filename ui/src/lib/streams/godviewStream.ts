// 🔥 GodView SSE Stream Client
// Handles real-time updates via Server-Sent Events

import type { TopologyResponse } from '../../api/godviewClient';
import type { K8sPod, K8sDeployment, LifecycleResponse } from '../../api/lifecycleClient';
import { setTopology } from '../../stores/godviewStore';
import { setPods, setDeployments } from '../../stores/lifecycleStore';
import { setHeartbeat } from '../../stores/heartbeatStore';

let eventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds

function connect() {
  if (eventSource) {
    eventSource.close();
  }

  try {
    eventSource = new EventSource('/api/stream');

    eventSource.addEventListener('topology', (ev) => {
      try {
        const data: TopologyResponse = JSON.parse(ev.data);
        setTopology(data);
        reconnectAttempts = 0; // Reset on successful message
      } catch (err) {
        console.error('[stream] Error parsing topology:', err);
      }
    });

    eventSource.addEventListener('pods', (ev) => {
      try {
        const data: LifecycleResponse<K8sPod> = JSON.parse(ev.data);
        setPods(data.items || []);
        reconnectAttempts = 0;
      } catch (err) {
        console.error('[stream] Error parsing pods:', err);
      }
    });

    eventSource.addEventListener('deploys', (ev) => {
      try {
        const data: LifecycleResponse<K8sDeployment> = JSON.parse(ev.data);
        setDeployments(data.items || []);
        reconnectAttempts = 0;
      } catch (err) {
        console.error('[stream] Error parsing deployments:', err);
      }
    });

    eventSource.addEventListener('heartbeat', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        setHeartbeat(data);
        console.debug('[stream] heartbeat', data);
        reconnectAttempts = 0;
      } catch (err) {
        console.error('[stream] Error parsing heartbeat:', err);
      }
    });

    eventSource.onopen = () => {
      console.log('[stream] Connected to SSE stream');
      reconnectAttempts = 0;
    };

    eventSource.onerror = (err) => {
      console.error('[stream] SSE error:', err);
      eventSource?.close();
      eventSource = null;

      // Auto-reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
        console.log(`[stream] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error('[stream] Max reconnect attempts reached');
      }
    };
  } catch (err) {
    console.error('[stream] Failed to create EventSource:', err);
    // Retry connection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      reconnectTimeout = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    }
  }
}

export function startGodviewStream() {
  if (eventSource) {
    console.log('[stream] Stream already started');
    return;
  }
  connect();
}

export function stopGodviewStream() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  reconnectAttempts = 0;
}

