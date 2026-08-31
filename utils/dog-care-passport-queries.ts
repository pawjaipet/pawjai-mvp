import "server-only";

import type {
  DogCareDocument,
  DogCareRecord,
  DogCareTimelineEvent,
  DogVaccinationRecord,
} from "@/types/database";
import type { DogCarePassport } from "@/utils/dog-care-passport";
import type { createAdminClient } from "@/utils/supabase/admin";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type DbError = { code?: string; message?: string } | null;

function isMissingCareTableError(error: DbError) {
  const message = (error?.message ?? "").toLowerCase();
  return error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("schema cache")
    || message.includes("could not find")
    || message.includes("does not exist")
    || message.includes("relation");
}

async function maybeSingleRow<T>(
  label: string,
  query: PromiseLike<{ data: T | null; error: DbError }>,
): Promise<T | null> {
  const { data, error } = await query;
  if (!error) return data ?? null;
  if (!isMissingCareTableError(error)) {
    console.error(`${label} failed to load`, error);
  }
  return null;
}

async function maybeRows<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: DbError }>,
): Promise<T[]> {
  const { data, error } = await query;
  if (!error) return data ?? [];
  if (!isMissingCareTableError(error)) {
    console.error(`${label} failed to load`, error);
  }
  return [];
}

export async function loadDogCarePassportForDog(
  supabase: SupabaseAdminClient,
  dogId: string,
): Promise<DogCarePassport> {
  const [careRecord, vaccinations, documents, timelineEvents] = await Promise.all([
    maybeSingleRow<DogCareRecord>(
      "Dog care record",
      supabase.from("dog_care_records").select("*").eq("dog_id", dogId).maybeSingle(),
    ),
    maybeRows<DogVaccinationRecord>(
      "Dog vaccination records",
      supabase
        .from("dog_vaccination_records")
        .select("*")
        .eq("dog_id", dogId)
        .order("administered_on", { ascending: false }),
    ),
    maybeRows<DogCareDocument>(
      "Dog care documents",
      supabase
        .from("dog_care_documents")
        .select("*")
        .eq("dog_id", dogId)
        .order("uploaded_at", { ascending: false }),
    ),
    maybeRows<DogCareTimelineEvent>(
      "Dog care timeline events",
      supabase
        .from("dog_care_timeline_events")
        .select("*")
        .eq("dog_id", dogId)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ),
  ]);

  const signedDocuments = await Promise.all(documents.map(async (document) => {
    if (document.file_url || !document.bucket_id || !document.storage_path) return document;
    const { data, error } = await supabase.storage
      .from(document.bucket_id)
      .createSignedUrl(document.storage_path, 60 * 60);
    if (error || !data?.signedUrl) return document;
    return { ...document, file_url: data.signedUrl };
  }));

  return {
    careRecord,
    documents: signedDocuments,
    timelineEvents,
    vaccinations,
  };
}
