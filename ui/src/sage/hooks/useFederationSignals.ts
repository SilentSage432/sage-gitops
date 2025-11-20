import { useEffect } from "react";
import { usePulseStore } from "../state/pulseStore";

export function useFederationSignals() {
  const pushPulse = usePulseStore((s) => s.pushPulse);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/stream");

    ws.onmessage = (msg) => {
      try {
        const packet = JSON.parse(msg.data as string);
        if (packet.type === "FEDERATION_EVENT") {
          pushPulse(packet.evt);
        }
      } catch {}
    };

    return () => ws.close();
  }, [pushPulse]);
}

