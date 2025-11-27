let federationToken: string | null = null;

export function setFederationToken(token: string) {
  federationToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("federationToken", token);
  }
}

export function getFederationToken() {
  if (federationToken) return federationToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("federationToken");
  }
  return null;
}

export function isFederated() {
  return Boolean(getFederationToken());
}

export function exportFederationEnvelope() {
  const token = getFederationToken();
  if (!token) return null;
  return {
    token,
    source: "ui",
    ts: Date.now(),
  };
}

export function importFederationEnvelope(env: { token: string }) {
  if (!env?.token) return false;
  setFederationToken(env.token);
  return true;
}
