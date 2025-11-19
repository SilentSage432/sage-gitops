declare module "./ws/stream.js" {
  import type { Server as HttpServer } from "http";

  export function initWSS(server: HttpServer): void;
  export function broadcast(payload: Record<string, unknown>): void;
}

