import React, { useEffect, useRef } from "react";

import { useTelemetryFilter } from "../../core/filters/useTelemetryFilter";
import { useWhispererStream } from "./useWhispererStream";
import { processCognitiveHooks } from "../../sage/cognition/whispererCognition";
import { operatorCognitiveSync } from "../../systems/operatorCognitiveSync";
import { operatorMemory } from "../../systems/operatorMemory";
import { contextPromptEngine } from "../../systems/contextPromptEngine";
import { autonomousAssistEngine } from "../../systems/autonomousAssistEngine";
import { predictiveModelEngine } from "../../systems/predictiveModelEngine";
import { uxStateMachine } from "../../systems/uxStateMachine";
import { autonomousStateShiftEngine } from "../../systems/autonomousStateShiftEngine";
import { panelAutoTriggerEngine } from "../../systems/panelAutoTriggerEngine";
import { panelAutoOpenEngine } from "../../systems/panelAutoOpenEngine";
import { panelSafetyGate } from "../../systems/panelSafetyGate";
import { panelReconfirmBuffer } from "../../systems/panelReconfirmBuffer";
import { panelEligibilityEngine } from "../../systems/panelEligibilityEngine";
import { panelExecutionHandshake } from "../../systems/panelExecutionHandshake";
import { panelActionExecutor } from "../../systems/panelActionExecutor";
import { panelRollbackManager } from "../../systems/panelRollbackManager";
import { panelExecutionScheduler } from "../../systems/panelExecutionScheduler";
import { panelPriorityEngine } from "../../systems/panelPriorityEngine";
import { panelSuppressionLayer } from "../../systems/panelSuppressionLayer";
import { panelRecoveryEngine } from "../../systems/panelRecoveryEngine";
import { panelIntegrityVerifier } from "../../systems/panelIntegrityVerifier";
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

  // Phase 50 — Federation-Ready UX State Machine
  useEffect(() => {
    const interval = setInterval(() => {
      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const directive = contextPromptEngine.evaluate({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      const projection = predictiveModelEngine.forecast({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      uxStateMachine.evaluate({ directive, projection });
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  // Phase 51 — Autonomous UX State Shifts
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = uxStateMachine.getState();
      autonomousStateShiftEngine.execute(currentState);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Phase 52 — Auto-Open Panel Triggering (logic only)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = uxStateMachine.getState();

      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const projection = predictiveModelEngine.forecast({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      panelAutoTriggerEngine.evaluate({ state, projection });
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 53 — Severity Classification + Safety Filter
  useEffect(() => {
    const interval = setInterval(() => {
      const trigger = panelAutoTriggerEngine.getPendingAction();

      const decision = panelSafetyGate.evaluateTrigger(trigger);

      console.debug("[SAGE] Safety gate decision:", trigger, "→", decision);

      // NOTE:
      // Phase 53 makes NO autonomous UI changes.
      // Decisions are logged only — execution comes in later phases.
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Phase 54 — Reconfirmation Buffer Layer
  useEffect(() => {
    const interval = setInterval(() => {
      const trigger = panelAutoTriggerEngine.getPendingAction();
      const safety = panelSafetyGate.evaluateTrigger(trigger);

      const status = panelReconfirmBuffer.update(trigger, safety);

      console.debug("[SAGE] Reconfirmation status:", trigger, "→", status);

      // NOTE:
      // Phase 54 DOES NOT execute any actions.
      // Phase 55+ will consume "confirmed" signals.
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 55 — Action Eligibility Layer
  useEffect(() => {
    const interval = setInterval(() => {
      const trigger = panelAutoTriggerEngine.getPendingAction();
      const safety = panelSafetyGate.evaluateTrigger(trigger);
      const reconfirm = panelReconfirmBuffer.update(trigger, safety);

      const eligible = panelEligibilityEngine.update(reconfirm, trigger);

      console.debug("[SAGE] Eligibility status:", eligible ?? "none");

      // NOTE:
      // Phase 55 STILL performs NO autonomous UI execution.
      // Later phases (56+) will consume eligibility.
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  // Phase 56 — Controlled Execution Handshake
  useEffect(() => {
    const interval = setInterval(() => {
      const eligible = panelEligibilityEngine.getEligible();
      const approval = panelExecutionHandshake.approve(eligible);

      console.debug("[SAGE] Execution handshake status:", eligible, "→", approval);

      // NOTE:
      // Phase 56 DOES NOT execute any UI action.
      // Phase 57+ will consume "approved" signals for controlled execution.
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 57 — Controlled Autonomous Execution (Internal Only)
  useEffect(() => {
    const interval = setInterval(() => {
      const eligible = panelEligibilityEngine.getEligible();
      const approval = panelExecutionHandshake.approve(eligible);

      if (approval === "approved" && eligible) {
        panelActionExecutor.execute(eligible);
        panelEligibilityEngine.clear(); // prevents repeats
      }

      // NOTE:
      // This phase executes actions ONLY internally.
      // Visual auto-opening begins in future phases.
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 59 — Autonomous Execution Scheduling
  useEffect(() => {
    const interval = setInterval(() => {
      const eligible = panelEligibilityEngine.getEligible();
      const approval = panelExecutionHandshake.approve(eligible);

      // If approved, enqueue instead of executing immediately
      if (approval === "approved" && eligible) {
        panelExecutionScheduler.enqueue(eligible);
        panelEligibilityEngine.clear();
      }

      // Release next scheduled action when safe
      const nextAction = panelExecutionScheduler.next();

      if (nextAction) {
        panelActionExecutor.execute(nextAction);
        panelRollbackManager.track(nextAction);

        // Once execution is handled, scheduler unlocks
        setTimeout(() => panelExecutionScheduler.complete(), 1000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 60 — Priority & Escalation Hierarchy
  useEffect(() => {
    const interval = setInterval(() => {
      const nextAction = panelExecutionScheduler.peek(); // peek only
      if (!nextAction) return;

      const currentState = uxStateMachine.getState();
      const priority = panelPriorityEngine.getPriority(nextAction);
      const escalate = panelPriorityEngine.shouldEscalate(nextAction, currentState);

      console.debug("[SAGE] Priority check:", nextAction, "→", priority);
      console.debug("[SAGE] Escalation status:", escalate ? "ESCALATE" : "normal");

      // NOTE:
      // Phase 60 does NOT execute escalation yet.
      // Future phases (61–63) will consume escalation signals.
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 61 — Autonomous Suppression Layer
  useEffect(() => {
    const interval = setInterval(() => {
      const nextAction = panelExecutionScheduler.peek(); // peek
      if (!nextAction) return;

      const currentState = uxStateMachine.getState();
      const priority = panelPriorityEngine.getPriority(nextAction);

      const suppressed = panelSuppressionLayer.shouldSuppress(
        nextAction,
        currentState,
        priority
      );

      console.debug(
        "[SAGE] Suppression status:",
        suppressed ? "BLOCKED" : "clear"
      );

      // NOTE:
      // Phase 61 does NOT remove actions from queue.
      // It only prevents execution until safe.
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 62 — Autonomous Recovery + Normalization
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = uxStateMachine.getState();
      const suppressed = panelSuppressionLayer.isSuppressed();

      const status = panelRecoveryEngine.update(currentState, suppressed);

      console.debug("[SAGE] Recovery status:", status);

      // NOTE:
      // Phase 62 DOES NOT trigger UI behavior.
      // It ONLY restores autonomy permissions internally.
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Phase 63 — Internal Consistency & Corruption Prevention
  useEffect(() => {
    const interval = setInterval(() => {
      const state = uxStateMachine.getState();
      const suppressed = panelSuppressionLayer.isSuppressed();
      const eligible = panelEligibilityEngine.getEligible();
      const executing = panelActionExecutor.getIsExecuting();

      const result = panelIntegrityVerifier.validate({
        state,
        suppressed,
        eligible,
        executing,
      });

      console.debug("[SAGE] Integrity status:", result);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 58 — Rollback & Persistence Safety
  useEffect(() => {
    // Wire rollback manager into executor
    panelActionExecutor.setRollbackManager(panelRollbackManager);

    const interval = setInterval(() => {
      const currentState = uxStateMachine.getState();

      const result = panelRollbackManager.evaluate(currentState);

      console.debug("[SAGE] Rollback monitor:", result ?? "inactive");

      // NOTE:
      // This DOES NOT reverse UI — internal logic only.
      // Later phases may extend rollback into visible behavior.
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Phase 53 — Panel Auto-Open Execution (with safety gate)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = uxStateMachine.getState();

      const profile = operatorCognitiveSync.getProfile();
      const trend = operatorMemory.getTrend();

      const projection = predictiveModelEngine.forecast({
        engagementLevel: profile.engagementLevel,
        trend,
      });

      const triggerAction = panelAutoTriggerEngine.evaluate({ state, projection });
      
      if (triggerAction) {
        // Validate through safety gate before execution
        const decision = panelSafetyGate.evaluateTrigger(triggerAction);
        
        if (decision === "allow") {
          panelAutoOpenEngine.execute(triggerAction);
        } else if (decision === "defer") {
          console.debug("[SAGE] Panel opening deferred — low priority trigger.");
        }
        // "deny" is silently ignored
      }
    }, 11000);

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
