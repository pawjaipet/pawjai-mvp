import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
