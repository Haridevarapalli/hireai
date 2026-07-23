import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;
