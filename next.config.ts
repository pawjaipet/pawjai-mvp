import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
