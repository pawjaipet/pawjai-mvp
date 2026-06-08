"use server";

import { parseDonationIntentInput } from "@/utils/donations";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function createDonationIntent(input: {
  amountThb: number;
  dogId: string;
  shelterId: string;
  treatCount: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to sponsor a dog.");
  }

  const payload = parseDonationIntentInput(input);
  const { data, error } = await supabase
    .from("donation_intents")
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

export async function markIntentViewedQR(intentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const normalizedIntentId = String(intentId ?? "").trim();

  if (!normalizedIntentId) {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("donation_intents")
    .update({ status: "viewed_qr" })
    .eq("id", normalizedIntentId)
    .eq("user_id", user.id);
}

export async function getShelterDonationDetails(shelterId: string) {
  const normalizedShelterId = String(shelterId ?? "").trim();

  if (!normalizedShelterId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("promptpay_id, bank_name, bank_account_number, bank_account_name")
    .eq("id", normalizedShelterId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
