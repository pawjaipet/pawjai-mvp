import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/utils/seo";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type SitemapDog = {
  adoption_status: string | null;
  id: string;
  updated_at: string | null;
};

async function loadAvailableDogsForSitemap(): Promise<SitemapDog[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dogs")
      .select("id, adoption_status, updated_at")
      .eq("adoption_status", "available")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Failed to load sitemap dog profiles", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("Skipping dog profile sitemap entries", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dogs = await loadAvailableDogsForSitemap();

  return buildSitemapEntries(dogs);
}
