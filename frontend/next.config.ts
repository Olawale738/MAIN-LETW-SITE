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

  async redirects() {
    return [
      // A short address the school office can say out loud, and that fits on a
      // printed letter: letw.org/portal.
      { source: '/portal', destination: '/theology-school/student', permanent: false },

      // /theology-school was an earlier, thinner version of the school page and
      // is not linked anywhere; /education/theology-school is the real one.
      // Redirecting rather than deleting keeps any link already handed out
      // working, and leaves exactly one page to maintain. Only the bare path —
      // /theology-school/apply, /student, /offer and /setup all live on.
      { source: '/theology-school', destination: '/education/theology-school', permanent: false },
    ]
  },
};

// Wrap with Sentry only when SENTRY_AUTH_TOKEN is set during build (for source
// map upload). Without it, the wrapper would still try to authenticate and fail
// the Vercel build. Runtime error capture works regardless via the
// sentry.client.config.ts / sentry.server.config.ts files.
let exportedConfig: NextConfig = nextConfig;
if (process.env.SENTRY_AUTH_TOKEN) {
    try {
        // Lazy require so missing module never breaks the build.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { withSentryConfig } = require('@sentry/nextjs');
        exportedConfig = withSentryConfig(nextConfig, {
            org: 'letworg',
            project: 'letw-frontend',
            silent: !process.env.CI,
            widenClientFileUpload: true,
            reactComponentAnnotation: { enabled: true },
            tunnelRoute: '/monitoring',
            sourcemaps: { disable: false },
            disableLogger: true,
            automaticVercelMonitors: true,
        });
    } catch {
        // Sentry build-time wrap failed — fall back to vanilla config.
    }
}

export default exportedConfig;
