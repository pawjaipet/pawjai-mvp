import { createClient } from "@/utils/supabase/server";

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
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  return (data ?? []).map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    companyName: row.company_name,
    clickUrl: row.click_url,
  }));
}
