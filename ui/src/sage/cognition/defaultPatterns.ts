import { registerPattern } from "./PatternEngine";
import { pushThought } from "./ThoughtChain";

// Pattern A: Operator repeats same command 3 times
registerPattern(
  "operator-repetition",
  (chain) => {
    const ops = chain.filter((t) => t.from === "operator");
    if (ops.length < 3) return false;

    const last = ops.slice(-3);
    return (
      last[0].text === last[1].text &&
      last[1].text === last[2].text
    );
  },
  () => {
    pushThought({
      id: crypto.randomUUID(),
      from: "kernel",
      text: "Pattern detected: Operator repeated command 3 times.",
      tags: ["pattern", "alert"],
      timestamp: Date.now(),
    });
  }
);

// Pattern B: High-frequency kernel ticks (stress signal)
registerPattern(
  "kernel-high-frequency",
  (chain) => {
    const kernels = chain.filter((t) => t.from === "kernel");
    if (kernels.length < 5) return false;

    const last5 = kernels.slice(-5);
    const windowMs = last5[last5.length - 1].timestamp - last5[0].timestamp;
    return windowMs < 3000; // 5 kernel events in <3 seconds
  },
  () => {
    pushThought({
      id: crypto.randomUUID(),
      from: "system",
      text: "⚠️ High kernel activity detected — possible system stress.",
      tags: ["pattern", "kernel", "warning"],
      timestamp: Date.now(),
    });
  }
);

