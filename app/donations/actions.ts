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
const DONATION_SLIP_IMAGE_EXTENSIONS = new Set(["heic", "heif", "jpeg", "jpg", "png", "webp"]);
const DONATION_SLIP_IMAGE_MIME_TYPES = new Set(["image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"]);
const DONATION_SLIP_JPEG_QUALITY = 86;
const MAX_DONATION_SLIP_BYTES = 6 * 1024 * 1024;

function donationSlipExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isDonationSlipImage(file: File) {
  const mimeType = file.type.split(";")[0]?.trim().toLowerCase();
  const extension = donationSlipExtension(file);
  return DONATION_SLIP_IMAGE_MIME_TYPES.has(mimeType) || DONATION_SLIP_IMAGE_EXTENSIONS.has(extension);
}

function isHeicDonationSlip(file: File) {
  const mimeType = file.type.split(";")[0]?.trim().toLowerCase();
  const extension = donationSlipExtension(file);
  return mimeType === "image/heic" || mimeType === "image/heif" || extension === "heic" || extension === "heif";
}

function storedDonationSlipFileName(file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, "").trim() || "transfer-slip";
  return `${baseName}.jpg`;
}

async function convertHeicDonationSlipToJpeg(buffer: Buffer) {
  try {
    const heicConvert = (await import("heic-convert")).default;
    const jpeg = await heicConvert({
      buffer: buffer as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: DONATION_SLIP_JPEG_QUALITY / 100,
    });

    return Buffer.from(jpeg);
  } catch {
    throw new Error("We couldn't convert that HEIC slip. Please export it as JPG or upload a different image.");
  }
}

async function prepareDonationSlipUpload(file: File) {
  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const imageBuffer = isHeicDonationSlip(file)
    ? await convertHeicDonationSlipToJpeg(sourceBuffer)
    : sourceBuffer;

  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(imageBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ mozjpeg: true, quality: DONATION_SLIP_JPEG_QUALITY })
      .toBuffer();

    return {
      body: buffer,
      contentType: "image/jpeg",
      extension: "jpg",
      storedFileName: storedDonationSlipFileName(file),
    };
  } catch {
    throw new Error("We couldn't process that slip image. Please upload a clear JPG, PNG, WEBP, HEIC, or HEIF image.");
  }
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

  if (!isDonationSlipImage(slip)) {
    return { message: "Upload a PNG, JPG, WEBP, HEIC, or HEIF image. Videos and PDFs are not supported.", status: "error" };
  }

  if (slip.size > MAX_DONATION_SLIP_BYTES) {
    return { message: "Transfer slip image must be 6 MB or smaller.", status: "error" };
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

  let preparedSlip: Awaited<ReturnType<typeof prepareDonationSlipUpload>>;
  try {
    preparedSlip = await prepareDonationSlipUpload(slip);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Transfer slip image could not be processed.",
      status: "error",
    };
  }

  const digest = createHash("sha256").update(preparedSlip.body).digest("hex").slice(0, 16);
  const storagePath = `${intent.shelter_id}/${user.id}/${intent.id}/${Date.now()}-${digest}.${preparedSlip.extension}`;
  const { error: uploadError } = await admin.storage
    .from(DONATION_SLIPS_BUCKET)
    .upload(storagePath, preparedSlip.body, {
      cacheControl: "3600",
      contentType: preparedSlip.contentType,
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
      proof_mime_type: preparedSlip.contentType,
      proof_original_file_name: preparedSlip.storedFileName,
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
