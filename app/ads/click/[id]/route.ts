import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fallbackUrl = new URL("/", request.url);
  const admin = createAdminClient();

  const { data: ad } = await admin
    .from("ads")
    .select("id, click_url")
    .eq("id", id)
    .maybeSingle();

  if (!ad?.click_url) {
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await admin.from("ad_clicks").insert({
      ad_id: ad.id,
      destination_url: ad.click_url,
      referrer: request.headers.get("referer"),
      user_agent: request.headers.get("user-agent"),
      user_id: user?.id ?? null,
    });
  } catch (error) {
    console.error("ad click tracking failed", error);
  }

  return NextResponse.redirect(ad.click_url);
}
