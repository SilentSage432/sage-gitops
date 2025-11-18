export interface FederationNode {
  id: string;
  role: 'core' | 'worker' | 'edge';
  status: 'healthy' | 'booting' | 'degraded' | 'offline';
  pods: number;
}

export interface Tenant {
  id: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
}

const mockFederationNodes: FederationNode[] = [
  { id: 'prime-01', role: 'core', status: 'healthy', pods: 42 },
  { id: 'pi-01', role: 'worker', status: 'healthy', pods: 5 },
  { id: 'pi-02', role: 'worker', status: 'booting', pods: 0 },
  { id: 'edge-01', role: 'edge', status: 'healthy', pods: 3 },
];

const mockTenants: Tenant[] = [
  { id: 'atlas', status: 'active' },
  { id: 'hearth', status: 'pending' },
  { id: 'meridian', status: 'suspended' },
  { id: 'nexus', status: 'active' },
];

export const getFederationNodes = async (): Promise<FederationNode[]> => {
  return [...mockFederationNodes];
};

export const getTenants = async (): Promise<Tenant[]> => {
  return [...mockTenants];
};

