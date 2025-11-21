export class IntentModel {
  private history: any[] = [];

  evaluate(event: any) {
    this.history.push(event);

    // naive scoring for now — gets replaced over time
    const confidence = Math.min(1, this.history.length / 20);

    return {
      label: this._infer(event),
      confidence
    };
  }

  private _infer(event: any): string {
    if (!event) return "unknown";

    if (event.type?.includes("open")) return "open-panel";
    if (event.type?.includes("focus")) return "focus-shift";
    if (event.type?.includes("nav")) return "nav-event";

    return "unknown";
  }
}

