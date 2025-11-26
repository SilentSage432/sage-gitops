/**
 * Get tenant ID from localStorage or URL parameters
 * Used throughout the dashboard to identify the current tenant
 */
export function getTenantId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try localStorage first (set during onboarding)
  const storedId = localStorage.getItem('lastTenantId');
  if (storedId) {
    return storedId;
  }

  // Try URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlTenantId = urlParams.get('tenantId');
  if (urlTenantId) {
    return urlTenantId;
  }

  // Try path parameter (e.g., /dashboard/:tenantId)
  const pathMatch = window.location.pathname.match(/\/dashboard\/([^/]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  return null;
}

