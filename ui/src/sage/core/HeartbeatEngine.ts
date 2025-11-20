import { EventEmitter } from "events";

export interface PulseMetrics {
  rate: number;      // beats per second
  intensity: number; // 0–1
  hue: number;       // 0–360 degrees
}

const emitter = new EventEmitter();
let current: PulseMetrics = { rate: 1, intensity: 0.3, hue: 265 };

export function getPulse() {
  return current;
}

// Called from telemetry stream (Whisperer + Node backend)
export function updatePulseFromTelemetry(payload: any) {
  const stress = payload?.stress ?? 0;
  const load = payload?.load ?? 0;
  const events = payload?.events ?? 0;

  const rate = 1 + Math.min(2, (stress + events) * 0.5);
  const intensity = 0.3 + Math.min(0.7, load * 0.6);
  const hue = 265 + Math.min(30, stress * 15);

  current = { rate, intensity, hue };
  emitter.emit("update", current);
}

export function onPulseUpdate(cb: (m: PulseMetrics) => void) {
  emitter.on("update", cb);
  return () => emitter.off("update", cb);
}

