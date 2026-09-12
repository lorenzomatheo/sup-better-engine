import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow fetching from backend API
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
