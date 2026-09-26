import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@aureon/contracts'],
};

export default nextConfig;
