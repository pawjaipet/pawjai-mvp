"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { parseDonationIntentInput } from "@/utils/donations";
import { assertRateLimit } from "@/utils/rate-limit";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type DonationSlipState = {
  message: string;
  status: "idle" | "error" | "success";
};

const DONATION_SLIPS_BUCKET = "donation-slips";
const DONATION_SLIP_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_DONATION_SLIP_BYTES = 10 * 1024 * 1024;

function donationSlipExtension(file: File) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

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

  await assertRateLimit({
    action: "donation_intent.create",
    identifier: user.id,
    limit: 20,
    windowSeconds: 60 * 60,
  });

  const { data: dog } = await supabase
    .from("dogs")
    .select("id,shelter_id")
    .eq("id", input.dogId)
    .maybeSingle();

  if (!dog || dog.shelter_id !== input.shelterId) {
    throw new Error("This donation does not match the selected dog and shelter.");
  }

  const payload = parseDonationIntentInput({
    ...input,
    shelterId: dog.shelter_id,
  });
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
    .eq("user_id", user.id)
    .eq("status", "initiated");
}

export async function submitDonationSlipAction(
  _previousState: DonationSlipState,
  formData: FormData,
): Promise<DonationSlipState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sign in before attaching a transfer slip.", status: "error" };
  }

  const intentId = String(formData.get("intentId") ?? "").trim();
  const slip = formData.get("slip");

  if (!intentId || !(slip instanceof File) || slip.size === 0) {
    return { message: "Choose a transfer slip to upload.", status: "error" };
  }

  if (!DONATION_SLIP_MIME_TYPES.has(slip.type)) {
    return { message: "Upload a PNG, JPG, WEBP, or PDF transfer slip.", status: "error" };
  }

  if (slip.size > MAX_DONATION_SLIP_BYTES) {
    return { message: "Transfer slip must be 10 MB or smaller.", status: "error" };
  }

  await assertRateLimit({
    action: "donation_slip.submit",
    identifier: user.id,
    limit: 10,
    windowSeconds: 60 * 60,
  });

  const admin = createAdminClient();
  const { data: intent, error: intentError } = await admin
    .from("donation_intents")
    .select("id,dog_id,shelter_id,status,proof_storage_path")
    .eq("id", intentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (intentError || !intent) {
    return { message: "This donation could not be found for your account.", status: "error" };
  }

  if (intent.status === "verified") {
    return { message: "This donation has already been verified by the shelter.", status: "error" };
  }

  const body = Buffer.from(await slip.arrayBuffer());
  const digest = createHash("sha256").update(body).digest("hex").slice(0, 16);
  const storagePath = `${intent.shelter_id}/${user.id}/${intent.id}/${Date.now()}-${digest}.${donationSlipExtension(slip)}`;
  const { error: uploadError } = await admin.storage
    .from(DONATION_SLIPS_BUCKET)
    .upload(storagePath, body, {
      cacheControl: "3600",
      contentType: slip.type,
      upsert: false,
    });

  if (uploadError) {
    return { message: `Transfer slip could not be uploaded: ${uploadError.message}`, status: "error" };
  }

  const submittedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("donation_intents")
    .update({
      proof_bucket_id: DONATION_SLIPS_BUCKET,
      proof_mime_type: slip.type,
      proof_original_file_name: slip.name,
      proof_storage_path: storagePath,
      proof_submitted_at: submittedAt,
      reviewed_at: null,
      reviewed_by: null,
      shelter_note: null,
      status: "proof_submitted",
    })
    .eq("id", intent.id)
    .eq("user_id", user.id);

  if (updateError) {
    await admin.storage.from(DONATION_SLIPS_BUCKET).remove([storagePath]);
    return { message: `Transfer slip could not be attached: ${updateError.message}`, status: "error" };
  }

  if (intent.proof_storage_path && intent.proof_storage_path !== storagePath) {
    await admin.storage.from(DONATION_SLIPS_BUCKET).remove([intent.proof_storage_path]);
  }

  revalidatePath(`/dogs/${intent.dog_id}/donate`);
  revalidatePath("/admin");
  revalidatePath("/shelter");

  return { message: "Transfer slip sent to the shelter.", status: "success" };
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
