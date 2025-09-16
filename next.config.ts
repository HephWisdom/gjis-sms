import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
    // Warning: This will disable ESLint during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
