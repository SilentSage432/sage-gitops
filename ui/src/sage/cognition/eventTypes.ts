export type CognitionEvent =
  | {
      type: "system.error";
      source: string;
      message: string;
      timestamp: number;
    }
  | {
      type: "system.warning";
      source: string;
      message: string;
      timestamp: number;
    }
  | {
      type: "system.state-shift";
      from: string;
      to: string;
      timestamp: number;
    }
  | {
      type: "rho2.epoch-rotation";
      epoch: number;
      participants: number;
      timestamp: number;
    };

