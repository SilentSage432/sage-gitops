import { IntentModel } from "../models/IntentModel";
import { PatternEngine } from "../engine/PatternEngine";
import { PredictiveSignal } from "../models/PredictiveSignal";

class PredictiveCore {
  private static _instance: PredictiveCore;
  private intentModel = new IntentModel();
  private patternEngine = new PatternEngine();

  static get instance() {
    if (!this._instance) this._instance = new PredictiveCore();
    return this._instance;
  }

  processEvent(event: any): PredictiveSignal {
    const intent = this.intentModel.evaluate(event);
    const pattern = this.patternEngine.track(event);

    return {
      timestamp: Date.now(),
      intent,
      pattern,
      confidence: Math.max(intent.confidence, pattern.confidence)
    };
  }
}

export const predictiveCore = PredictiveCore.instance;

