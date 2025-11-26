/**
 * Single source of truth for bootstrap kit downloads
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function downloadBootstrapKit(tenantId: string): Promise<void> {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  // Get OCT token
  const octStorage = localStorage.getItem('oct-storage');
  const octToken = octStorage ? JSON.parse(octStorage).token : '';

  const response = await fetch(`${API_BASE_URL}/api/onboarding/bootstrap/kit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${octToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenantId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download kit: ${errorText || response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bootstrap-kit-${tenantId.substring(0, 8)}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


