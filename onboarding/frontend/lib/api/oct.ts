const OCT_KEY = 'oct-storage';

export interface OCTData {
  token: string;
  expiresAt: number;
  scopes: string[];
}

export function storeOCT(data: OCTData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OCT_KEY, JSON.stringify(data));
  }
}

export function getOCT(): OCTData | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(OCT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export function clearOCT(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OCT_KEY);
  }
}

export function isOCTValid(): boolean {
  const oct = getOCT();
  if (!oct) return false;
  
  const now = Date.now();
  return oct.expiresAt > now;
}

export function getOCTToken(): string | null {
  const oct = getOCT();
  if (!oct || !isOCTValid()) return null;
  return oct.token;
}

