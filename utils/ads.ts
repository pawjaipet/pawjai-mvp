import { createClient } from "@/utils/supabase/server";
import { shuffleAdsForDate } from "@/utils/ad-rotation";
import { normalizeDogMediaUrl } from "@/utils/dog-media";

export interface Ad {
  id: string;
  imageUrl: string;
  companyName: string;
  clickUrl: string;
}

export async function fetchActiveAds(): Promise<Ad[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("ads")
    .select("id, image_url, company_name, click_url")
    .eq("ad_status", "approved")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("company_name", { ascending: true });

  const ads = (data ?? []).map((row) => ({
    id: row.id,
    imageUrl: normalizeDogMediaUrl(row.image_url) ?? row.image_url,
    companyName: row.company_name,
    clickUrl: row.click_url,
  }));

  return shuffleAdsForDate(ads, today);
}
