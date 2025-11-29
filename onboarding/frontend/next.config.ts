import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
