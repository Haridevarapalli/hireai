import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  allowedDevOrigins: ['10.60.177.185', '127.0.0.1', 'localhost'],

  output: process.env.GITHUB_ACTIONS ? 'export' : undefined,

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;