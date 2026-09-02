import type { Metadata } from "next";

export const SITE_URL = "https://www.pawjaipet.com";

export const BRAND_SEARCH_ALIASES = [
  "PawJai",
  "PawJai Pet",
  "PawJai Thailand",
  "PawJai dog adoption",
  "Project Pet",
  "Project Pet Thailand",
  "Project Pet shelter",
] as const;

export const PUBLIC_SITEMAP_PATHS = ["/", "/about", "/dogs", "/shelter"] as const;

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/admin/",
  "/admindraft",
  "/ads",
  "/appointments",
  "/auth",
  "/booking",
  "/documents",
  "/doglistings",
  "/dogs/*/donate",
  "/donations",
  "/filter",
  "/messages",
  "/onboarding",
  "/profile",
  "/schedule",
  "/settings",
  "/shelter/",
] as const;

const NOINDEX_PREFIXES = [
  "/admin",
  "/admindraft",
  "/adopted",
  "/ads",
  "/appointments",
  "/auth",
  "/booking",
  "/documents",
  "/doglistings",
  "/donations",
  "/filter",
  "/home",
  "/messages",
  "/more",
  "/onboarding",
  "/profile",
  "/schedule",
  "/settings",
  "/swipe",
] as const;

export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

type SitemapDog = {
  adoption_status: string | null;
  id: string;
  updated_at: string | null;
};

function normalizePath(path: string) {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

export function canonicalUrl(path = "/") {
  return new URL(normalizePath(path), SITE_URL).toString();
}

export function isNoindexPath(path: string) {
  const pathname = normalizePath(path);

  if (/^\/dogs\/[^/]+\/donate$/.test(pathname)) return true;
  if (pathname.startsWith("/shelter/")) return true;

  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function buildSitemapEntries(dogs: SitemapDog[] = []) {
  const publicEntries = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: canonicalUrl(path),
    changeFrequency: path === "/" ? "daily" as const : "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const dogEntries = dogs
    .filter((dog) => dog.adoption_status === "available")
    .map((dog) => ({
      url: canonicalUrl(`/dogs/${dog.id}`),
      lastModified: dog.updated_at ? new Date(dog.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...publicEntries, ...dogEntries];
}

export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: NOINDEX_ROBOTS,
  };
}
