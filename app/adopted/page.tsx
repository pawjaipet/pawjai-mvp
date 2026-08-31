import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import AdoptedPetPassport, { type AdoptedPetPassportData } from "@/components/adopted/AdoptedPetPassport";
import { ensureAdopterForUser } from "@/utils/adopter";
import { canonicalizeBreedLabel } from "@/utils/dog-breeds";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { DogPhoto, DogTrait, Dog, Shelter } from "@/types/database";

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

function pickCoverPhoto(dog: Dog, photos: DogPhotoPreview[]) {
  const coverPhoto =
    photos.find((photo) => photo.id === dog.cover_photo_id) ??
    photos.find((photo) => photo.is_cover) ??
    [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];

  return coverPhoto ? normalizeDogMediaUrl(coverPhoto.public_url, coverPhoto.storage_path) : null;
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

  const [{ data: photos }, { data: traits }, { data: shelters }] = await Promise.all([
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

  return dogIds.flatMap((dogId) => {
    const dog = dogMap.get(dogId);
    if (!dog) return [];

    const dogTraits = traitsByDog.get(dog.id) ?? [];
    const shelter = shelterMap.get(dog.shelter_id) ?? null;
    return [{
      adoptionDate: appointmentMap.get(dog.id)?.appointment_date ?? null,
      ageMonths: dog.age_months,
      breed: canonicalizeBreedLabel(dog.breed),
      coverUrl: pickCoverPhoto(dog, photosByDog.get(dog.id) ?? []),
      gender: dog.gender,
      id: dog.id,
      medicalTags: dogTraits
        .filter((trait) => trait.trait_type === "medical_needs")
        .map((trait) => trait.trait_value),
      name: dog.name,
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
      specialNeeds: dog.special_needs,
      sterilized: dog.sterilized,
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
