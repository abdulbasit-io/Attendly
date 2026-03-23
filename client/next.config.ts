import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Fix Turbopack workspace root detection (multiple lockfiles in parent dirs)
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Allow images from external sources (e.g. avatar CDNs)
  images: {
    remotePatterns: [],
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
