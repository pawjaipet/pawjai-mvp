import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import AdoptedPetPassport, { type AdoptedPetPassportData } from "@/components/adopted/AdoptedPetPassport";
import { ensureAdopterForUser } from "@/utils/adopter";
import { canonicalizeBreedLabel } from "@/utils/dog-breeds";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type {
  DogCareDocument,
  DogCareRecord,
  DogCareTimelineEvent,
  DogPhoto,
  DogTrait,
  Dog,
  DogVaccinationRecord,
  Shelter,
} from "@/types/database";

type AdoptionAppointment = {
  appointment_date: string;
  appointment_time: string | null;
  dog_id: string | null;
  id: string;
  shelter_id: string;
};

type DogPhotoPreview = Pick<DogPhoto, "dog_id" | "id" | "is_cover" | "public_url" | "sort_order" | "storage_path">;
type DogTraitPreview = Pick<DogTrait, "dog_id" | "trait_type" | "trait_value">;
type ShelterPreview = Pick<Shelter, "district" | "id" | "logo_url" | "name" | "province">;
type DogCareRecordPreview = Pick<
  DogCareRecord,
  | "adopter_id"
  | "allergies"
  | "dog_id"
  | "last_vet_check_date"
  | "medical_notes"
  | "medications"
  | "next_vet_check_due_date"
  | "special_needs_notes"
  | "updated_at"
  | "vaccination_status"
>;
type DogVaccinationRecordPreview = Pick<
  DogVaccinationRecord,
  | "administered_on"
  | "dog_id"
  | "due_on"
  | "id"
  | "notes"
  | "provider_name"
  | "updated_at"
  | "vaccine_name"
  | "verification_status"
>;
type DogCareDocumentPreview = Pick<
  DogCareDocument,
  | "document_type"
  | "dog_id"
  | "bucket_id"
  | "file_url"
  | "id"
  | "storage_path"
  | "title"
  | "uploaded_at"
  | "visibility"
>;
type DogCareTimelineEventPreview = Pick<
  DogCareTimelineEvent,
  "created_at" | "description" | "dog_id" | "event_date" | "event_type" | "id" | "title"
>;
type OptionalRowsResult<T> = {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
};

function pickCoverPhoto(dog: Dog, photos: DogPhotoPreview[]) {
  const coverPhoto =
    photos.find((photo) => photo.id === dog.cover_photo_id) ??
    photos.find((photo) => photo.is_cover) ??
    [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];

  return coverPhoto ? normalizeDogMediaUrl(coverPhoto.public_url, coverPhoto.storage_path) : null;
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

async function loadOptionalRows<T>(label: string, query: PromiseLike<OptionalRowsResult<T>>): Promise<T[]> {
  const { data, error } = await query;
  if (!error) return data ?? [];
  if (!isMissingCareTableError(error)) {
    console.error(`${label} failed to load`, error);
  }
  return [];
}

function groupByDog<T extends { dog_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const dogRows = grouped.get(row.dog_id) ?? [];
    dogRows.push(row);
    grouped.set(row.dog_id, dogRows);
  }
  return grouped;
}

function latestDate(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

async function getAdoptedPets(adopterId: string): Promise<AdoptedPetPassportData[]> {
  const admin = createAdminClient();
  const { data: completedAppointments } = await admin
    .from("appointments")
    .select("id, dog_id, shelter_id, appointment_date, appointment_time")
    .eq("adopter_id", adopterId)
    .eq("status", "completed")
    .not("dog_id", "is", null)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  const appointmentMap = new Map<string, AdoptionAppointment>();
  for (const appointment of (completedAppointments ?? []) as AdoptionAppointment[]) {
    if (appointment.dog_id && !appointmentMap.has(appointment.dog_id)) {
      appointmentMap.set(appointment.dog_id, appointment);
    }
  }

  const dogIds = [...appointmentMap.keys()];
  if (dogIds.length === 0) return [];

  const { data: dogs } = await admin
    .from("dogs")
    .select("*")
    .in("id", dogIds)
    .eq("adoption_status", "adopted");

  const adoptedDogs = (dogs ?? []) as Dog[];
  if (adoptedDogs.length === 0) return [];

  const adoptedDogIds = adoptedDogs.map((dog) => dog.id);
  const shelterIds = [...new Set(adoptedDogs.map((dog) => dog.shelter_id))];

  const [{ data: photos }, { data: traits }, { data: shelters }, careRecords, vaccinations, documents, timelineEvents] = await Promise.all([
    admin
      .from("dog_photos")
      .select("id, dog_id, public_url, storage_path, is_cover, sort_order")
      .in("dog_id", adoptedDogIds)
      .order("sort_order", { ascending: true }),
    admin
      .from("dog_traits")
      .select("dog_id, trait_type, trait_value")
      .in("dog_id", adoptedDogIds)
      .order("created_at", { ascending: true }),
    shelterIds.length
      ? admin
        .from("shelters")
        .select("id, name, logo_url, district, province")
        .in("id", shelterIds)
      : Promise.resolve({ data: [] }),
    loadOptionalRows<DogCareRecordPreview>(
      "Dog care records",
      admin
        .from("dog_care_records")
        .select("adopter_id, allergies, dog_id, last_vet_check_date, medical_notes, medications, next_vet_check_due_date, special_needs_notes, updated_at, vaccination_status")
        .in("dog_id", adoptedDogIds),
    ),
    loadOptionalRows<DogVaccinationRecordPreview>(
      "Dog vaccination records",
      admin
        .from("dog_vaccination_records")
        .select("administered_on, dog_id, due_on, id, notes, provider_name, updated_at, vaccine_name, verification_status")
        .in("dog_id", adoptedDogIds)
        .order("due_on", { ascending: true, nullsFirst: false })
        .order("administered_on", { ascending: false, nullsFirst: false }),
    ),
    loadOptionalRows<DogCareDocumentPreview>(
      "Dog care documents",
      admin
        .from("dog_care_documents")
        .select("bucket_id, document_type, dog_id, file_url, id, storage_path, title, uploaded_at, visibility")
        .in("dog_id", adoptedDogIds)
        .neq("visibility", "shelter_only")
        .order("uploaded_at", { ascending: false }),
    ),
    loadOptionalRows<DogCareTimelineEventPreview>(
      "Dog care timeline events",
      admin
        .from("dog_care_timeline_events")
        .select("created_at, description, dog_id, event_date, event_type, id, title")
        .in("dog_id", adoptedDogIds)
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ),
  ]);

  const photosByDog = new Map<string, DogPhotoPreview[]>();
  for (const photo of (photos ?? []) as DogPhotoPreview[]) {
    const dogPhotos = photosByDog.get(photo.dog_id) ?? [];
    dogPhotos.push(photo);
    photosByDog.set(photo.dog_id, dogPhotos);
  }

  const traitsByDog = new Map<string, DogTraitPreview[]>();
  for (const trait of (traits ?? []) as DogTraitPreview[]) {
    const dogTraits = traitsByDog.get(trait.dog_id) ?? [];
    dogTraits.push(trait);
    traitsByDog.set(trait.dog_id, dogTraits);
  }

  const shelterMap = new Map(((shelters ?? []) as ShelterPreview[]).map((shelter) => [shelter.id, shelter]));
  const dogMap = new Map(adoptedDogs.map((dog) => [dog.id, dog]));
  const careRecordMap = new Map(careRecords
    .filter((record) => !record.adopter_id || record.adopter_id === adopterId)
    .map((record) => [record.dog_id, record]));
  const vaccinationsByDog = groupByDog(vaccinations);
  const documentsByDog = groupByDog(documents);
  const timelineByDog = groupByDog(timelineEvents);
  const signedDocumentUrls = new Map<string, string>();

  await Promise.all(documents.map(async (document) => {
    if (!document.bucket_id || !document.storage_path || document.file_url) return;
    const { data, error } = await admin.storage
      .from(document.bucket_id)
      .createSignedUrl(document.storage_path, 60 * 60);
    if (!error && data?.signedUrl) {
      signedDocumentUrls.set(document.id, data.signedUrl);
    }
  }));

  return dogIds.flatMap((dogId) => {
    const dog = dogMap.get(dogId);
    if (!dog) return [];

    const dogTraits = traitsByDog.get(dog.id) ?? [];
    const shelter = shelterMap.get(dog.shelter_id) ?? null;
    const careRecord = careRecordMap.get(dog.id) ?? null;
    const dogVaccinations = vaccinationsByDog.get(dog.id) ?? [];
    const dogDocuments = documentsByDog.get(dog.id) ?? [];
    const dogTimeline = timelineByDog.get(dog.id) ?? [];
    const appointment = appointmentMap.get(dog.id);
    return [{
      adoptionDate: appointment?.appointment_date ?? null,
      ageMonths: dog.age_months,
      allergies: careRecord?.allergies ?? null,
      breed: canonicalizeBreedLabel(dog.breed),
      careTimeline: dogTimeline.map((event) => ({
        createdAt: event.created_at,
        description: event.description,
        eventDate: event.event_date,
        eventType: event.event_type,
        id: event.id,
        title: event.title,
      })),
      coverUrl: pickCoverPhoto(dog, photosByDog.get(dog.id) ?? []),
      documents: dogDocuments.map((document) => ({
        documentType: document.document_type,
        fileUrl: document.file_url ?? signedDocumentUrls.get(document.id) ?? null,
        id: document.id,
        storagePath: document.storage_path,
        title: document.title,
        uploadedAt: document.uploaded_at,
      })),
      gender: dog.gender,
      id: dog.id,
      lastUpdatedAt: latestDate([
        dog.updated_at,
        careRecord?.updated_at,
        ...dogVaccinations.map((vaccination) => vaccination.updated_at),
        ...dogDocuments.map((document) => document.uploaded_at),
        ...dogTimeline.map((event) => event.created_at),
      ]),
      lastVetCheckDate: careRecord?.last_vet_check_date ?? null,
      medicalNotes: careRecord?.medical_notes ?? null,
      medicalTags: dogTraits
        .filter((trait) => trait.trait_type === "medical_needs")
        .map((trait) => trait.trait_value),
      medications: careRecord?.medications ?? null,
      messageHref: appointment ? `/appointments/${appointment.id}?tab=messages` : null,
      name: dog.name,
      nextVetCheckDueDate: careRecord?.next_vet_check_due_date ?? null,
      personalityTags: dogTraits
        .filter((trait) => trait.trait_type === "personality")
        .map((trait) => trait.trait_value),
      shelter: shelter ? {
        district: shelter.district,
        id: shelter.id,
        logoUrl: shelter.logo_url,
        name: shelter.name,
        province: shelter.province,
      } : null,
      size: dog.size,
      specialNeedsNotes: careRecord?.special_needs_notes ?? null,
      specialNeeds: dog.special_needs,
      sterilized: dog.sterilized,
      vaccinationStatus: careRecord?.vaccination_status ?? "unknown",
      vaccinations: dogVaccinations.map((vaccination) => ({
        administeredOn: vaccination.administered_on,
        dueOn: vaccination.due_on,
        id: vaccination.id,
        notes: vaccination.notes,
        providerName: vaccination.provider_name,
        updatedAt: vaccination.updated_at,
        vaccineName: vaccination.vaccine_name,
        verificationStatus: vaccination.verification_status,
      })),
      weightKg: dog.weight_kg,
    }];
  });
}

export default async function AdoptedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/adopted"
        reason="Sign in to view your adopted pets."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const pets = await getAdoptedPets(adopter.id);

  return <AdoptedPetPassport pets={pets} />;
}
