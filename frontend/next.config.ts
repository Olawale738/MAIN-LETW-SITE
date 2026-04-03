import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Allow CMS images served from the backend API (development)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/cms/images/**',
      },
      // Allow production backend domain (update hostname to match your deployment)
      {
        protocol: 'https',
        hostname: '*.lytehosting.com',
        port: '',
        pathname: '/api/cms/images/**',
      },
    ],
  },
};

export default nextConfig;
