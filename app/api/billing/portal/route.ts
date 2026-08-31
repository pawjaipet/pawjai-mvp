import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getStripe, isStripeBillingConfigured, pawjaiSiteOrigin } from "@/utils/stripe";

export async function POST() {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json({ error: "Paid subscriptions are paused during launch." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data } = await createAdminClient()
    .from("billing_subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.provider_customer_id) {
    return NextResponse.json({ error: "No billing account exists yet." }, { status: 404 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: data.provider_customer_id,
      return_url: `${pawjaiSiteOrigin()}/settings/subscription`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Billing Portal could not be created", error);
    return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
