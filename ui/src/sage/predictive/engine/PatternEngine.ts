export class PatternEngine {
  private memory: string[] = [];
  private lastUpdate = Date.now();

  track(event: any) {
    const type = event.type || "unknown";
    this.memory.push(type);

    // decay older patterns
    const delta = Date.now() - this.lastUpdate;
    this.lastUpdate = Date.now();

    const confidence = Math.min(1, (1000 / delta) * 0.1);

    return {
      label: type,
      confidence: Math.max(0.05, Math.min(confidence, 1))
    };
  }
}

