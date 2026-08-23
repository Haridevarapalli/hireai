import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  allowedDevOrigins: ['10.44.60.185'],

  output: 'export',
  basePath: process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : (process.env.GITHUB_ACTIONS ? '/hireai' : ''),

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;