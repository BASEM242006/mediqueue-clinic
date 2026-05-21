import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    if (!apiUrl || apiUrl.includes('localhost:3000')) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
