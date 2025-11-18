export interface NodeHealth {
  cpu: number;
  mem: number;
  pods: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
}

export const getNodeHealth = async (): Promise<NodeHealth> => {
  return {
    cpu: 14,
    mem: 21,
    pods: 128,
    status: 'operational',
  };
};

