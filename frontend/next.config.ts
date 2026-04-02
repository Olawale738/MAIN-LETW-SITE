import type { NextConfig } from "next";

// Dynamically add the production backend hostname from NEXT_PUBLIC_API_URL
// so Next/Image can load CMS images in production without hardcoding the domain.
function getBackendHostname(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    return new URL(apiUrl).hostname;
  } catch {
    return null;
  }
}

const backendHostname = getBackendHostname();

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
      // ✅ Dynamically allow the backend hostname from NEXT_PUBLIC_API_URL (any onrender.com subdomain)
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        port: '',
        pathname: '/api/cms/images/**',
      },
      // ✅ If a specific production hostname is set via NEXT_PUBLIC_API_URL, allow it too
      ...(backendHostname && backendHostname !== 'localhost'
        ? [{
            protocol: 'https' as const,
            hostname: backendHostname,
            port: '',
            pathname: '/api/cms/images/**',
          }]
        : []),
    ],
  },
};

export default nextConfig;
