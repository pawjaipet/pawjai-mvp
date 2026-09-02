import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admindraft/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
      {
        source: "/admin/reorg-draft",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/listings",
        destination: "/admin?view=dogs",
        permanent: true,
      },
      {
        source: "/admin/bookings",
        destination: "/admin?view=bookings",
        permanent: true,
      },
      {
        source: "/admin/ads",
        destination: "/admin?view=ads",
        permanent: true,
      },
      {
        source: "/admin/pawjaiprofile",
        destination: "/admin/aboutcontent",
        permanent: true,
      },
      {
        source: "/admin/dog-creation",
        destination: "/admin/dogs/new",
        permanent: true,
      },
    ];
  },
  experimental: {
    proxyClientMaxBodySize: "210mb",
    serverActions: {
      bodySizeLimit: "210mb",
    },
  },
  outputFileTracingIncludes: {
    "/admin/**/*": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/ads/**/*": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/admindraft/**/*": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  serverExternalPackages: ["ffmpeg-static"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bdnyvcvkyepipdcygkvn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
