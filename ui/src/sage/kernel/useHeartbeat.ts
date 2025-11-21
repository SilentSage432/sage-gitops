import { useEffect } from "react";
import { startHeartbeat } from "./HeartbeatEngine";

export function useHeartbeat() {
  useEffect(() => {
    startHeartbeat();
  }, []);
}

