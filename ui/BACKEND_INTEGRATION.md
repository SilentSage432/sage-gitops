# Backend WebSocket Integration Guide

When your Pi cluster backend is ready, the UI will **automatically switch** from mock data to live data. No UI code changes needed!

## Setup

1. Set environment variable:
   ```bash
   # In .env.local or production env
   VITE_SAGE_WS_URL=ws://your-pi-cluster:7001
   ```

2. Start your WebSocket server

3. The UI will automatically connect and switch from mocks to real data

## WebSocket Endpoints Required

### 1. Federation Nodes List
**Endpoint:** `ws://your-server/federation/nodes`

**Message Format (from server):**
```json
{
  "nodes": [
    {
      "id": "pi-01",
      "status": "online" | "degraded" | "offline",
      "role": "worker",
      "lastSeen": 1234567890
    }
  ]
}
```

**Hook:** `useFederationNodes()`

---

### 2. Node Signal Stream (Metrics)
**Endpoint:** `ws://your-server/nodes/{nodeId}/stream`

**Message Format (from server):**
```json
{
  "cpu": "15.3%",
  "memory": "214 MB",
  "heartbeat": "3:45:23 PM",
  "status": "ONLINE" | "DEGRADED" | "OFFLINE"
}
```

**Hook:** `useNodeSignalStream(nodeId)`

---

### 3. Node Events Stream
**Endpoint:** `ws://your-server/nodes/{nodeId}/events`

**Message Format (from server):**
```json
{
  "type": "info" | "warning" | "critical",
  "message": "Event description",
  "timestamp": 1234567890,
  "metadata": {
    "cpu": 45.2,
    "memory": 67.8,
    "temp": 72.5
  }
}
```

**Hook:** `useNodeEvents(nodeId)`

---

### 4. Pi Thermal Metrics
**Endpoint:** `ws://your-server/nodes/{nodeId}/thermal`

**Message Format (from server):**
```json
{
  "tempC": 65.3,
  "powerW": 3.8,
  "clockMHz": 1400,
  "voltage": 4.95,
  "throttled": false
}
```

**Hook:** `usePiThermalMetrics(nodeId)`

**Note:** Only used for nodes with IDs starting with `pi-`

---

### 5. Mesh Telemetry
**Endpoint:** `ws://your-server/mesh/telemetry`

**Message Format (from server):**
```json
{
  "node": "pi-01",
  "cpu": 45.2,
  "memory": 67.8,
  "temp": 65.3,
  "latency": 12.5,
  "timestamp": 1234567890
}
```

**Hook:** `useMeshTelemetry()`

**Note:** Can send multiple packets - UI keeps last 50

---

## Fallback Behavior

All hooks follow this pattern:
1. ✅ Try to connect to WebSocket if `VITE_SAGE_WS_URL` is set
2. ✅ If connection fails → automatically fallback to mock data
3. ✅ No errors or crashes - graceful degradation
4. ✅ UI continues to work with mock data

## Testing

To test without a real backend:
- Don't set `VITE_SAGE_WS_URL` → uses mocks
- Set invalid URL → tries connection, falls back to mocks

To test with real backend:
- Set `VITE_SAGE_WS_URL=ws://localhost:7001`
- Start your WebSocket server
- UI automatically switches to real data

## Data Flow

```
Backend WebSocket Server
    ↓
Environment Variable (VITE_SAGE_WS_URL)
    ↓
Hook detects URL → Connects to WebSocket
    ↓
Receives data → Updates React state
    ↓
UI Components automatically re-render
```

**No UI changes needed!** Just implement the backend endpoints above.

