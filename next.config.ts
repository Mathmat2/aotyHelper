import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lastfm.freetls.fastly.net',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'node:crypto': 'commonjs crypto',
    });
    return config;
  },
  reactStrictMode: false,
};

export default nextConfig;
