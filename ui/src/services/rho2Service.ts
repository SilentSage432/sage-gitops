export interface EpochStream {
  currentEpoch: number;
  fingerprint: string;
  participants: number;
  integrity: 'verified' | 'pending' | 'failed';
  nextEpochEtaSeconds: number;
}

export const getEpochStream = async (): Promise<EpochStream> => {
  return {
    currentEpoch: 1127,
    fingerprint: '6afc...92b1',
    participants: 6,
    integrity: 'verified',
    nextEpochEtaSeconds: 83,
  };
};

