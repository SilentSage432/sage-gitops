import { useRef } from "react";
import { useUIPulse } from "../../core/UIPulseContext";
import { useUIShockwave } from "../../core/UIShockwaveContext";

/**
 * Cognitive Stability Layer
 * Prevents runaway UI reactions by adding cooldown + rate limiting.
 */
export function useCognitiveStability() {
  const { pulseSoft } = useUIPulse();
  const { shockwaveMinor } = useUIShockwave();

  const lastPulse = useRef(0);
  const lastShock = useRef(0);

  const PULSE_COOLDOWN = 1200;   // ms
  const SHOCK_COOLDOWN = 4000;  // ms

  function safePulse() {
    const now = Date.now();
    if (now - lastPulse.current < PULSE_COOLDOWN) return;
    lastPulse.current = now;
    pulseSoft();
  }

  function safeShockwave() {
    const now = Date.now();
    if (now - lastShock.current < SHOCK_COOLDOWN) return;
    lastShock.current = now;
    shockwaveMinor();
  }

  return { safePulse, safeShockwave };
}

