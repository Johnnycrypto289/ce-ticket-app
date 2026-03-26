import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  allowedDevOrigins: ['192.168.5.153'],
};

export default nextConfig;
