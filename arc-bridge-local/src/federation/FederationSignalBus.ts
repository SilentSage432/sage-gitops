import { EventEmitter } from "events";
import { createEvent, FederationEvent } from "./FederationEvent.js";

class SignalBus extends EventEmitter {
  dispatch(signal: FederationEvent) {
    this.emit("federation-signal", signal);
  }

  /**
   * Conv convenience wrapper — auto-constructs the event
   */
  emitSignal(
    signal: FederationEvent["signal"],
    source: string,
    payload: any = {}
  ) {
    const evt = createEvent(signal, source, payload);
    this.dispatch(evt);
    return evt;
  }
}

export const FederationSignalBus = new SignalBus();

