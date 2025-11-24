import { useEffect, useState } from "react";

const MESSAGES = [
  "Rho² guardian handshake verified",
  "Mesh heartbeat synchronized",
  "Bootstrap policy hash sealed",
  "Key rotation window evaluated",
  "Signal horizon mapped",
  "Tenant scope registration acknowledged",
  "Audit channel initialized",
  "Secure channel seeded"
];

export function useActivityStream() {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const push = () => {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setLog((prev) => {
        const next = [`› ${msg}`, ...prev];
        return next.slice(0, 12); // keep latest 12
      });
    };

    const schedule = () => {
      return setTimeout(() => {
        push();
        schedule();
      }, 5000 + Math.random() * 7000); // 5–12s
    };

    const timer = schedule();

    return () => clearTimeout(timer);
  }, []);

  return log;
}

