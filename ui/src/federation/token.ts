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
