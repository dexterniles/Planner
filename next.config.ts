import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS for 2 years; include subdomains; allow preload list submission.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block clickjacking — no one frames this app.
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send origin (no path) on cross-origin nav, full referrer same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Tight permissions policy — disable unused browser APIs by default.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  experimental: {
    optimizePackageImports: ["@base-ui/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
    minimumCacheTTL: 2592000, // 30 days; TMDB poster URLs are immutable
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
