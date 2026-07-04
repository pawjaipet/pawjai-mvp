import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

export type AdminDraftShelter = {
  address: string;
  bankConfigured: boolean;
  description: string | null;
  district: string | null;
  dogsCount: number;
  email: string | null;
  googleMapsUrl: string | null;
  id: string;
  location: string;
  logoUrl: string | null;
  meetingInstructions: string | null;
  name: string;
  pendingBookingsCount: number;
  phoneNumber: string | null;
  province: string | null;
  unreadMessageCount: number;
  websiteUrl: string | null;
};

export type AdminDraftDog = {
  breed: string | null;
  coverUrl: string | null;
  createdAt: string;
  energyLevel: string | null;
  gender: string;
  id: string;
  name: string;
  photosCount: number;
  shelterId: string;
  shelterName: string;
  size: string | null;
  status: string;
  updatedAt: string;
};

export type AdminDraftBooking = {
  appointmentDate: string;
  appointmentTime: string;
  bookingCode: string | null;
  checkedIn: boolean;
  dogId: string | null;
  dogName: string;
  id: string;
  shelterId: string;
  shelterName: string;
  status: string;
};

export type AdminDraftAd = {
  clickUrl: string;
  companyName: string;
  endDate: string;
  id: string;
  imageUrl: string;
  isActive: boolean;
  startDate: string;
};

export type AdminDraftAboutContent = {
  heroSlogan: string | null;
  missionBody: string | null;
  missionTitle: string | null;
  partnerSheltersCount: number;
  updatedAt: string | null;
};

export type AdminDraftData = {
  about: AdminDraftAboutContent | null;
  ads: AdminDraftAd[];
  bookings: AdminDraftBooking[];
  dogs: AdminDraftDog[];
  error: string | null;
  shelters: AdminDraftShelter[];
  source: "fallback" | "supabase";
  updatedAt: string;
};

function fallbackData(error: string): AdminDraftData {
  return {
    about: null,
    ads: [],
    bookings: [],
    dogs: [],
    error,
    shelters: [],
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
}

function formatAddress(shelter: {
  address_line: string | null;
  district: string | null;
  postal_code: string | null;
  province: string | null;
  subdistrict: string | null;
}) {
  return [
    shelter.address_line,
    shelter.subdistrict,
    shelter.district,
    shelter.province,
    shelter.postal_code,
  ].filter(Boolean).join(", ");
}

function countJsonArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export async function loadAdminDraftData(): Promise<AdminDraftData> {
  let supabase: ReturnType<typeof createAdminClient>;

  try {
    supabase = createAdminClient();
  } catch (error) {
    return fallbackData(error instanceof Error ? error.message : "Supabase admin client is unavailable.");
  }

  const [sheltersResult, dogsResult, dogPhotosResult, bookingsResult, messagesResult, adsResult, aboutResult] = await Promise.all([
    supabase
      .from("shelters")
      .select("id,name,phone_number,email,address_line,subdistrict,district,province,postal_code,description,website_url,logo_url,google_maps_url,meeting_instructions,promptpay_id,bank_name,bank_account_number,bank_account_name")
      .order("name", { ascending: true }),
    supabase
      .from("dogs")
      .select("id,name,breed,adoption_status,shelter_id,created_at,updated_at,gender,size,energy_level")
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("dog_photos")
      .select("dog_id,public_url,is_cover,sort_order")
      .order("sort_order", { ascending: true })
      .limit(1000),
    supabase
      .from("appointments")
      .select("id,shelter_id,dog_id,appointment_date,appointment_time,status,created_at")
      .order("appointment_date", { ascending: true })
      .limit(200),
    supabase
      .from("appointment_messages")
      .select("id,shelter_id,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("ads")
      .select("id,company_name,image_url,click_url,is_active,start_date,end_date")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("pawjai_profile")
      .select("hero_slogan,mission_title,mission_body,partner_shelters,updated_at")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  const firstError = sheltersResult.error ?? dogsResult.error ?? dogPhotosResult.error ?? bookingsResult.error ?? messagesResult.error ?? adsResult.error ?? aboutResult.error;
  if (firstError) {
    return fallbackData(firstError.message);
  }

  const rawShelters = sheltersResult.data ?? [];
  const rawDogs = dogsResult.data ?? [];
  const rawDogPhotos = dogPhotosResult.data ?? [];
  const rawBookings = bookingsResult.data ?? [];
  const rawMessages = messagesResult.data ?? [];
  const rawAds = adsResult.data ?? [];
  const rawAbout = aboutResult.data ?? null;

  const shelterNames = new Map(rawShelters.map((shelter) => [shelter.id, shelter.name]));
  const dogNames = new Map(rawDogs.map((dog) => [dog.id, dog.name]));
  const dogsByShelter = new Map<string, number>();
  const photoSummaryByDog = new Map<string, { coverUrl: string | null; photosCount: number }>();
  const pendingBookingsByShelter = new Map<string, number>();
  const messagesByShelter = new Map<string, number>();

  for (const dog of rawDogs) {
    dogsByShelter.set(dog.shelter_id, (dogsByShelter.get(dog.shelter_id) ?? 0) + 1);
  }

  for (const photo of rawDogPhotos) {
    const current = photoSummaryByDog.get(photo.dog_id) ?? { coverUrl: null, photosCount: 0 };

    photoSummaryByDog.set(photo.dog_id, {
      coverUrl: photo.is_cover ? photo.public_url : current.coverUrl ?? photo.public_url,
      photosCount: current.photosCount + 1,
    });
  }

  for (const booking of rawBookings) {
    if (booking.status === "requested") {
      pendingBookingsByShelter.set(booking.shelter_id, (pendingBookingsByShelter.get(booking.shelter_id) ?? 0) + 1);
    }
  }

  for (const message of rawMessages) {
    messagesByShelter.set(message.shelter_id, (messagesByShelter.get(message.shelter_id) ?? 0) + 1);
  }

  return {
    about: rawAbout
      ? {
          heroSlogan: rawAbout.hero_slogan,
          missionBody: rawAbout.mission_body,
          missionTitle: rawAbout.mission_title,
          partnerSheltersCount: countJsonArray(rawAbout.partner_shelters),
          updatedAt: rawAbout.updated_at,
        }
      : null,
    ads: rawAds.map((ad) => ({
      clickUrl: ad.click_url,
      companyName: ad.company_name,
      endDate: ad.end_date,
      id: ad.id,
      imageUrl: ad.image_url,
      isActive: ad.is_active,
      startDate: ad.start_date,
    })),
    bookings: rawBookings.map((booking) => ({
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      bookingCode: null,
      checkedIn: false,
      dogId: booking.dog_id,
      dogName: booking.dog_id ? dogNames.get(booking.dog_id) ?? "Dog profile" : "Shelter visit",
      id: booking.id,
      shelterId: booking.shelter_id,
      shelterName: shelterNames.get(booking.shelter_id) ?? "Unknown shelter",
      status: booking.status,
    })),
    dogs: rawDogs.map((dog) => {
      const photoSummary = photoSummaryByDog.get(dog.id) ?? { coverUrl: null, photosCount: 0 };

      return {
        breed: dog.breed,
        coverUrl: photoSummary.coverUrl,
        createdAt: dog.created_at,
        energyLevel: dog.energy_level,
        gender: dog.gender,
        id: dog.id,
        name: dog.name,
        photosCount: photoSummary.photosCount,
        shelterId: dog.shelter_id,
        shelterName: shelterNames.get(dog.shelter_id) ?? "Unknown shelter",
        size: dog.size,
        status: dog.adoption_status,
        updatedAt: dog.updated_at,
      };
    }),
    error: null,
    shelters: rawShelters.map((shelter) => ({
      address: formatAddress(shelter),
      bankConfigured: Boolean(shelter.promptpay_id || shelter.bank_name || shelter.bank_account_number || shelter.bank_account_name),
      description: shelter.description,
      district: shelter.district,
      dogsCount: dogsByShelter.get(shelter.id) ?? 0,
      email: shelter.email,
      googleMapsUrl: shelter.google_maps_url,
      id: shelter.id,
      location: [shelter.district, shelter.province].filter(Boolean).join(", ") || shelter.province || "Thailand",
      logoUrl: shelter.logo_url,
      meetingInstructions: shelter.meeting_instructions,
      name: shelter.name,
      pendingBookingsCount: pendingBookingsByShelter.get(shelter.id) ?? 0,
      phoneNumber: shelter.phone_number,
      province: shelter.province,
      unreadMessageCount: messagesByShelter.get(shelter.id) ?? 0,
      websiteUrl: shelter.website_url,
    })),
    source: "supabase",
    updatedAt: new Date().toISOString(),
  };
}
