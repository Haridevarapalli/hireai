import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  allowedDevOrigins: ['10.44.60.185'],

  output: process.env.GITHUB_ACTIONS ? 'export' : undefined,

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;