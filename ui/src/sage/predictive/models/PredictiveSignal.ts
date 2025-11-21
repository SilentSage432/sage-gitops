export interface PredictiveSignal {
  timestamp: number;
  intent: { label: string; confidence: number };
  pattern: { label: string; confidence: number };
  confidence: number;
}

