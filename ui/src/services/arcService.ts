export interface ArcStatus {
  name: string;
  status: 'operational' | 'syncing' | 'secure' | 'degraded' | 'offline';
  lastUpdate: string;
  signals: number;
  warnings: number;
}

export interface ArcSummary {
  name: string;
  status: 'operational' | 'syncing' | 'secure' | 'degraded' | 'offline';
}

const mockArcData: Record<string, ArcStatus> = {
  theta: {
    name: 'theta',
    status: 'operational',
    lastUpdate: new Date().toISOString(),
    signals: 12,
    warnings: 0,
  },
  sigma: {
    name: 'sigma',
    status: 'syncing',
    lastUpdate: new Date(Date.now() - 30000).toISOString(),
    signals: 8,
    warnings: 1,
  },
  omega: {
    name: 'omega',
    status: 'operational',
    lastUpdate: new Date().toISOString(),
    signals: 15,
    warnings: 0,
  },
  rho2: {
    name: 'rho2',
    status: 'secure',
    lastUpdate: new Date().toISOString(),
    signals: 0,
    warnings: 0,
  },
  lambda: {
    name: 'lambda',
    status: 'operational',
    lastUpdate: new Date().toISOString(),
    signals: 6,
    warnings: 0,
  },
  chi: {
    name: 'chi',
    status: 'operational',
    lastUpdate: new Date().toISOString(),
    signals: 9,
    warnings: 0,
  },
};

export const getArcStatus = async (arcName: string): Promise<ArcStatus> => {
  const normalized = arcName.toLowerCase();
  const arc = mockArcData[normalized];
  
  if (!arc) {
    return {
      name: normalized,
      status: 'offline',
      lastUpdate: new Date().toISOString(),
      signals: 0,
      warnings: 0,
    };
  }
  
  return { ...arc };
};

export const getArcSummary = async (): Promise<ArcSummary[]> => {
  return Object.values(mockArcData).map((arc) => ({
    name: arc.name,
    status: arc.status,
  }));
};

