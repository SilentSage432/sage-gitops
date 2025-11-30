import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { proxyTimeout: 5000 },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';
    return [
      // Proxy WebAuthn registration endpoints to Go backend
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      // Proxy federation auth endpoints to Go backend
      {
        source: '/api/federation/auth/:path*',
        destination: `${backendUrl}/api/federation/auth/:path*`,
      },
      // Proxy federation state requests to Node.js backend (port 7070)
      {
        source: '/api/federation/state',
        destination: 'http://localhost:7070/federation/state',
      },
      // Proxy other federation routes to Node.js backend
      {
        source: '/federation/:path*',
        destination: 'http://localhost:7070/federation/:path*',
      },
    ];
  },
};

export default nextConfig;
