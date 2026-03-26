import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ['192.168.5.153'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
