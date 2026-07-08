import type { MetadataRoute } from "next";
import {
  ROBOTS_DISALLOW_PATHS,
  SITE_URL,
  canonicalUrl,
} from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: canonicalUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
