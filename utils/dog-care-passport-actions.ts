import "server-only";

import type { Database } from "@/types/database";
import type { DogVaccinationStatus, DogVaccinationVerificationStatus } from "@/utils/dog-care-passport";
import type { createAdminClient } from "@/utils/supabase/admin";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
const DOG_CARE_DOCUMENTS_BUCKET = "application-documents";
const DOG_CARE_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const DOG_CARE_DOCUMENT_TYPES = new Set<Database["public"]["Enums"]["dog_care_document_type"]>([
  "adoption_document",
  "vaccination_proof",
  "medical_record",
  "other",
]);
const DOG_CARE_DOCUMENT_VISIBILITIES = new Set<Database["public"]["Enums"]["dog_care_document_visibility"]>([
  "adopter_visible",
  "shelter_only",
]);
const MAX_DOG_CARE_DOCUMENT_BYTES = 15 * 1024 * 1024;

const DOG_VACCINATION_STATUSES = new Set<DogVaccinationStatus>([
  "unknown",
  "not_started",
  "partial",
  "up_to_date",
  "overdue",
]);

const DOG_VACCINATION_VERIFICATION_STATUSES = new Set<DogVaccinationVerificationStatus>([
  "verified",
  "pending",
  "unknown",
]);

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getStringValues(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function optionalText(value: string) {
  return value.trim() || null;
}

function optionalDate(value: string) {
  const cleanValue = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(cleanValue) ? cleanValue : null;
}

function enumValue<T extends string>(value: string, allowed: Set<T>, fallback: T) {
  return allowed.has(value as T) ? value as T : fallback;
}

function sanitizeFileName(value: string) {
  const extension = value.includes(".") ? value.split(".").pop()?.toLowerCase() : "";
  const baseName = value.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${baseName || "care-document"}${extension ? `.${extension}` : ""}`;
}

function isMissingCareTableError(error: { code?: string; message?: string } | null | undefined) {
  const message = (error?.message ?? "").toLowerCase();
  return error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("schema cache")
    || message.includes("could not find")
    || message.includes("does not exist")
    || message.includes("relation");
}

export async function saveDogCarePassportFromForm({
  actorProfileId,
  adopterId = null,
  dogId,
  formData,
  shelterId,
  supabase,
}: {
  actorProfileId: string | null;
  adopterId?: string | null;
  dogId: string;
  formData: FormData;
  shelterId: string;
  supabase: SupabaseAdminClient;
}) {
  const carePayload: Database["public"]["Tables"]["dog_care_records"]["Insert"] = {
    adopter_id: adopterId,
    allergies: optionalText(getString(formData, "care_allergies")),
    dog_id: dogId,
    last_updated_by: actorProfileId,
    last_vet_check_date: optionalDate(getString(formData, "care_last_vet_check_date")),
    medical_notes: optionalText(getString(formData, "care_medical_notes")),
    medications: optionalText(getString(formData, "care_medications")),
    next_vet_check_due_date: optionalDate(getString(formData, "care_next_vet_check_due_date")),
    shelter_id: shelterId,
    special_needs_notes: optionalText(getString(formData, "care_special_needs_notes")),
    updated_at: new Date().toISOString(),
    vaccination_status: enumValue(
      getString(formData, "care_vaccination_status"),
      DOG_VACCINATION_STATUSES,
      "unknown",
    ),
  };

  const { error: careError } = await supabase
    .from("dog_care_records")
    .upsert(carePayload, { onConflict: "dog_id" });

  if (careError) {
    if (isMissingCareTableError(careError)) return;
    throw new Error(`Care passport could not be saved: ${careError.message}`);
  }

  const ids = getStringValues(formData, "vaccine_record_id");
  const names = getStringValues(formData, "vaccine_name");
  const administeredDates = getStringValues(formData, "vaccine_administered_on");
  const dueDates = getStringValues(formData, "vaccine_due_on");
  const providers = getStringValues(formData, "vaccine_provider_name");
  const notes = getStringValues(formData, "vaccine_notes");
  const verificationStatuses = getStringValues(formData, "vaccine_verification_status");
  const documentIds = getStringValues(formData, "vaccine_document_id");
  const rowCount = Math.max(
    ids.length,
    names.length,
    administeredDates.length,
    dueDates.length,
    providers.length,
    notes.length,
    verificationStatuses.length,
    documentIds.length,
  );

  for (let index = 0; index < rowCount; index += 1) {
    const id = ids[index] ?? "";
    const vaccineName = optionalText(names[index] ?? "");

    if (!vaccineName) {
      if (id) {
        const { error } = await supabase
          .from("dog_vaccination_records")
          .delete()
          .eq("id", id)
          .eq("dog_id", dogId);
        if (isMissingCareTableError(error)) return;
        if (error) throw new Error(`Blank vaccine row could not be removed: ${error.message}`);
      }
      continue;
    }

    const vaccinePayload: Database["public"]["Tables"]["dog_vaccination_records"]["Insert"] = {
      administered_on: optionalDate(administeredDates[index] ?? ""),
      adopter_id: adopterId,
      created_by: actorProfileId,
      document_id: optionalText(documentIds[index] ?? ""),
      dog_id: dogId,
      due_on: optionalDate(dueDates[index] ?? ""),
      notes: optionalText(notes[index] ?? ""),
      provider_name: optionalText(providers[index] ?? ""),
      shelter_id: shelterId,
      updated_at: new Date().toISOString(),
      vaccine_name: vaccineName,
      verification_status: enumValue(
        verificationStatuses[index] ?? "",
        DOG_VACCINATION_VERIFICATION_STATUSES,
        "unknown",
      ),
    };

    const { error } = id
      ? await supabase
          .from("dog_vaccination_records")
          .update(vaccinePayload)
          .eq("id", id)
          .eq("dog_id", dogId)
      : await supabase
          .from("dog_vaccination_records")
          .insert(vaccinePayload);

    if (error) {
      if (isMissingCareTableError(error)) return;
      throw new Error(`Vaccination record could not be saved: ${error.message}`);
    }
  }

  const documentFile = formData.get("care_document_file");
  if (documentFile instanceof File && documentFile.size > 0) {
    if (documentFile.size > MAX_DOG_CARE_DOCUMENT_BYTES) {
      throw new Error("Care document is too large. Please upload a file under 15 MB.");
    }

    if (!DOG_CARE_DOCUMENT_MIME_TYPES.has(documentFile.type)) {
      throw new Error("Care document must be a PNG, JPG, WEBP, or PDF file.");
    }

    const originalName = sanitizeFileName(documentFile.name || "care-document");
    const storagePath = `dog-care/${shelterId}/${dogId}/${crypto.randomUUID()}-${originalName}`;
    const buffer = Buffer.from(await documentFile.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(DOG_CARE_DOCUMENTS_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        contentType: documentFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Care document could not be uploaded: ${uploadError.message}`);
    }

    const documentType = enumValue(
      getString(formData, "care_document_type"),
      DOG_CARE_DOCUMENT_TYPES,
      "other",
    );
    const visibility = enumValue(
      getString(formData, "care_document_visibility"),
      DOG_CARE_DOCUMENT_VISIBILITIES,
      "adopter_visible",
    );
    const title = optionalText(getString(formData, "care_document_title"))
      ?? documentFile.name
      ?? "Care document";
    const { error: documentError } = await supabase.from("dog_care_documents").insert({
      adopter_id: adopterId,
      bucket_id: DOG_CARE_DOCUMENTS_BUCKET,
      document_type: documentType,
      dog_id: dogId,
      file_url: null,
      shelter_id: shelterId,
      storage_path: storagePath,
      title,
      uploaded_by: actorProfileId,
      visibility,
    });

    if (documentError) {
      throw new Error(`Care document record could not be saved: ${documentError.message}`);
    }
  }
}

export async function linkDogCarePassportToAdopter({
  actorProfileId,
  adopterId,
  dogId,
  shelterId,
  supabase,
}: {
  actorProfileId: string | null;
  adopterId: string;
  dogId: string;
  shelterId: string;
  supabase: SupabaseAdminClient;
}) {
  const timestamp = new Date().toISOString();

  const { data: existingCareRecord, error: readCareError } = await supabase
    .from("dog_care_records")
    .select("id")
    .eq("dog_id", dogId)
    .maybeSingle();
  if (isMissingCareTableError(readCareError)) return;
  if (readCareError) throw new Error(`Care passport could not be checked: ${readCareError.message}`);

  const { error: careError } = existingCareRecord
    ? await supabase
        .from("dog_care_records")
        .update({
          adopter_id: adopterId,
          last_updated_by: actorProfileId,
          shelter_id: shelterId,
          updated_at: timestamp,
        })
        .eq("dog_id", dogId)
    : await supabase
        .from("dog_care_records")
        .insert({
          adopter_id: adopterId,
          dog_id: dogId,
          last_updated_by: actorProfileId,
          shelter_id: shelterId,
          updated_at: timestamp,
        });
  if (isMissingCareTableError(careError)) return;
  if (careError) throw new Error(`Care passport could not be linked to adopter: ${careError.message}`);

  const childUpdates = await Promise.all([
    supabase.from("dog_vaccination_records").update({ adopter_id: adopterId }).eq("dog_id", dogId),
    supabase.from("dog_care_documents").update({ adopter_id: adopterId }).eq("dog_id", dogId),
    supabase.from("dog_care_timeline_events").update({ adopter_id: adopterId }).eq("dog_id", dogId),
  ]);
  const childUpdateError = childUpdates.find((result) => result.error)?.error;
  if (isMissingCareTableError(childUpdateError)) return;
  if (childUpdateError) {
    throw new Error(`Care passport details could not be linked to adopter: ${childUpdateError.message}`);
  }

  const { data: existingAdoptionEvent } = await supabase
    .from("dog_care_timeline_events")
    .select("id")
    .eq("dog_id", dogId)
    .eq("adopter_id", adopterId)
    .eq("event_type", "adoption")
    .limit(1)
    .maybeSingle();

  if (!existingAdoptionEvent) {
    const { error: timelineError } = await supabase.from("dog_care_timeline_events").insert({
      adopter_id: adopterId,
      created_by: actorProfileId,
      description: "Adoption completed. This care passport can now be used for post-adoption support.",
      dog_id: dogId,
      event_date: timestamp.slice(0, 10),
      event_type: "adoption",
      shelter_id: shelterId,
      title: "Adoption completed",
    });

    if (timelineError) {
      throw new Error(`Adoption timeline event could not be saved: ${timelineError.message}`);
    }
  }
}
