export interface SimNodeMetrics {
  cpu: number;
  temp: number;
  latency: number;
  heartbeat: boolean;
}

const randomRange = (min: number, max: number) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(1));

export const createSimulatedNode = () => {
  let heartbeat = true;
  return () => {
    heartbeat = !heartbeat;
    return {
      cpu: randomRange(4, 38),
      temp: randomRange(42, 63),
      latency: randomRange(8, 42),
      heartbeat,
    } as SimNodeMetrics;
  };
};

