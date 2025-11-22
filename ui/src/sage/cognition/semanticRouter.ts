import { CognitionEvent } from "./eventTypes";

type RouteChannel = "critical" | "warning" | "state" | "rho2";

export function getPriority(event: CognitionEvent): number {
  switch (event.type) {
    case "system.error":
      return 1; // highest
    case "system.warning":
      return 2;
    case "system.state-shift":
      return 3;
    case "rho2.epoch-rotation":
      return 4;
    default:
      return 99;
  }
}

export function getChannel(event: CognitionEvent): RouteChannel {
  switch (event.type) {
    case "system.error":
      return "critical";
    case "system.warning":
      return "warning";
    case "system.state-shift":
      return "state";
    case "rho2.epoch-rotation":
      return "rho2";
    default:
      return "state";
  }
}

export function routeEvent(
  event: CognitionEvent,
  handlers: Record<RouteChannel, (e: CognitionEvent) => void>
) {
  const channel = getChannel(event);

  if (handlers[channel]) {
    handlers[channel](event);
  }
}

