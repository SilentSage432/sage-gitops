import React, { useEffect, useRef } from "react";

import { useTelemetryFilter } from "../../core/filters/useTelemetryFilter";
import { useWhispererStream } from "./useWhispererStream";
import { processCognitiveHooks } from "../../sage/cognition/whispererCognition";
import { operatorCognitiveSync } from "../../systems/operatorCognitiveSync";
import { operatorMemory } from "../../systems/operatorMemory";
import { contextPromptEngine } from "../../systems/contextPromptEngine";
import { autonomousAssistEngine } from "../../systems/autonomousAssistEngine";
import { predictiveModelEngine } from "../../systems/predictiveModelEngine";
import "./whisperer.css";

export function WhispererTerminal() {
  const { messages } = useWhispererStream();
  const { activeFilter } = useTelemetryFilter();

  const containerRef = useRef<HTMLDivElement>(null);

  function messageMatchesFilter(msg: string): boolean {
    if (activeFilter === "ALL") return true;

    const map: Record<string, string> = {
      SYSTEM: "[SYSTEM]",
      ARC: "[ARC_EVENT]",
      RHO2: "[RHO2_EVENT]",
      FEDERATION: "[FEDERATION_EVENT]",
      AGENT: "[AGENT_EVENT]",
      WHISPERER: "[WHISPERER]",
      ERROR: "[ERROR]",
      DEBUG: "[DEBUG]",
      HEARTBEAT: "[HEARTBEAT_TICK]",
    };

    const tag = map[activeFilter];
    if (!tag) return true;

    return msg.includes(tag);
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }

    processCognitiveHooks(messages);
  }, [messages]);

  // Phase 45: Adaptive Operator Responses
  useEffect(() => {
    const unsubscribe = operatorCognitiveSync.subscribe((profile) => {
      // Phase 46: Record state in memory
      operatorMemory.recordState(profile.engagementLevel);

      switch (profile.engagementLevel) {
        case "focused":
          // subtle: system minimizes UX noise
          console.debug("[SAGE] Operator in focused mode — stabilizing output.");
          break;

        case "overloaded":
          // subtle: system reduces reactive bursts
          console.debug("[SAGE] Operator overloaded — reducing UI intensity.");
          break;

        default:
          // neutral baseline
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Phase 46: Memory-Aware Adaptive Responses
  useEffect(() => {
    const interval = setInterval(() => {
      const trend = operatorMemory.getTrend();

      switch (trend) {
        case "improving":
          console.debug("[SAGE] Operator trend improving — optimizing responsiveness.");
          break;

        case "declining":
          console.debug("[SAGE] Operator declining — lowering cognitive demand.");
          break;

        default:
          // stable baseline — no action
          break;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Phase 47 — Contextual System Prompts (internal only)
  useEffect(() => {
    const interval = setInterval(() => {
      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const result = contextPromptEngine.evaluate({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      switch (result) {
        case "stabilize":
          console.debug("[SAGE] Internal directive: stabilize output cadence.");
          break;

        case "optimize":
          console.debug("[SAGE] Internal directive: optimize responsiveness.");
          break;

        default:
          // no action — remain silent
          break;
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 48 — Autonomous Assistive Behavior
  useEffect(() => {
    const interval = setInterval(() => {
      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const directive = contextPromptEngine.evaluate({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      autonomousAssistEngine.execute(directive);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 49 — Predictive Operator Modeling
  useEffect(() => {
    const interval = setInterval(() => {
      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const projection = predictiveModelEngine.forecast({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      switch (projection) {
        case "risk_overload":
          console.debug("[SAGE] Predictive model: operator trend indicates upcoming overload — preparing stabilization.");
          break;

        case "sustain_focus":
          console.debug("[SAGE] Predictive model: sustaining focused state — maintaining optimal responsiveness.");
          break;

        default:
          // no forecast — remain silent
          break;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto p-4 font-mono text-sm text-white"
    >
      {messages
        .filter(messageMatchesFilter)
        .map((msg, idx) => (
          <div key={idx} className="mb-1 whitespace-pre-wrap">
            {msg}
          </div>
        ))}
    </div>
  );
}
