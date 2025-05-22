import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {}, 
  eslint: {
    ignoreDuringBuilds: true, // Disables ESLint checks during builds (e.g., on Vercel)
  },// Remove unrecognized keys
};

export default nextConfig;