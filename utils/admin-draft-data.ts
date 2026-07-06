import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

export type AdminDraftShelter = {
  address: string;
  addressLine?: string | null;
  availability?: AdminDraftShelterAvailability[];
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankConfigured: boolean;
  bankName?: string | null;
  description: string | null;
  district: string | null;
  dogsCount: number;
  email: string | null;
  facebookUrl?: string | null;
  googleMapsUrl: string | null;
  id: string;
  instagramUrl?: string | null;
  location: string;
  logoUrl: string | null;
  meetingInstructions: string | null;
  name: string;
  pendingBookingsCount: number;
  phoneNumber: string | null;
  postalCode?: string | null;
  promptpayId?: string | null;
  province: string | null;
  regularHours?: AdminDraftShelterRegularHours[];
  subdistrict?: string | null;
  unreadMessageCount: number;
  websiteUrl: string | null;
};

export type AdminDraftShelterAvailability = {
  availabilityType: string;
  endDate: string;
  id: string;
  note: string | null;
  startDate: string;
};

export type AdminDraftShelterRegularHours = {
  closesAt: string | null;
  dayOfWeek: number;
  id: string;
  isClosed: boolean;
  opensAt: string | null;
  slotDurationMinutes: number;
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
  adopterEmail: string | null;
  adopterId: string;
  adopterName: string;
  adopterPhoneNumber: string | null;
  appointmentDate: string;
  appointmentTime: string;
  bookingCode: string | null;
  checkedIn: boolean;
  dogBreed: string | null;
  dogId: string | null;
  dogName: string;
  id: string;
  proposedAppointmentDate: string | null;
  proposedAppointmentTime: string | null;
  shelterDistrict: string | null;
  shelterId: string;
  shelterName: string;
  shelterNote: string | null;
  shelterProvince: string | null;
  status: string;
  visitorNote: string | null;
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

  const [sheltersResult, dogsResult, dogPhotosResult, bookingsResult, messagesResult, adsResult, aboutResult, availabilityResult, regularHoursResult] = await Promise.all([
    supabase
      .from("shelters")
      .select("id,name,phone_number,email,address_line,subdistrict,district,province,postal_code,description,website_url,facebook_url,instagram_url,logo_url,google_maps_url,meeting_instructions,promptpay_id,bank_name,bank_account_number,bank_account_name")
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
      .select("*")
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
    (supabase as any)
      .from("shelter_availability")
      .select("id,shelter_id,availability_type,start_date,end_date,note")
      .order("start_date", { ascending: true }),
    supabase
      .from("shelter_regular_hours")
      .select("id,shelter_id,day_of_week,is_closed,opens_at,closes_at,slot_duration_minutes")
      .order("day_of_week", { ascending: true }),
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
  const rawAvailability = availabilityResult.error ? [] : availabilityResult.data ?? [];
  const rawRegularHours = regularHoursResult.error ? [] : regularHoursResult.data ?? [];
  const bookingAdopterIds = [...new Set(rawBookings.map((booking) => booking.adopter_id).filter(Boolean))];
  const adoptersResult = bookingAdopterIds.length
    ? await supabase
        .from("adopters")
        .select("id,first_name,last_name,email,phone_number")
        .in("id", bookingAdopterIds)
    : { data: [], error: null };

  const shelterSummary = new Map(rawShelters.map((shelter) => [shelter.id, shelter]));
  const dogSummary = new Map(rawDogs.map((dog) => [dog.id, dog]));
  const adopterSummary = new Map((adoptersResult.data ?? []).map((adopter) => [adopter.id, adopter]));
  const shelterNames = new Map(rawShelters.map((shelter) => [shelter.id, shelter.name]));
  const dogNames = new Map(rawDogs.map((dog) => [dog.id, dog.name]));
  const dogsByShelter = new Map<string, number>();
  const photoSummaryByDog = new Map<string, { coverUrl: string | null; photosCount: number }>();
  const pendingBookingsByShelter = new Map<string, number>();
  const messagesByShelter = new Map<string, number>();
  const availabilityByShelter = new Map<string, AdminDraftShelterAvailability[]>();
  const regularHoursByShelter = new Map<string, AdminDraftShelterRegularHours[]>();

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

  for (const range of rawAvailability as Array<{
    availability_type: string;
    end_date: string;
    id: string;
    note: string | null;
    shelter_id: string;
    start_date: string;
  }>) {
    const items = availabilityByShelter.get(range.shelter_id) ?? [];
    items.push({
      availabilityType: range.availability_type,
      endDate: range.end_date,
      id: range.id,
      note: range.note,
      startDate: range.start_date,
    });
    availabilityByShelter.set(range.shelter_id, items);
  }

  for (const hours of rawRegularHours) {
    const items = regularHoursByShelter.get(hours.shelter_id) ?? [];
    items.push({
      closesAt: hours.closes_at,
      dayOfWeek: hours.day_of_week,
      id: hours.id,
      isClosed: hours.is_closed,
      opensAt: hours.opens_at,
      slotDurationMinutes: hours.slot_duration_minutes,
    });
    regularHoursByShelter.set(hours.shelter_id, items);
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
      adopterEmail: adopterSummary.get(booking.adopter_id)?.email ?? null,
      adopterId: booking.adopter_id,
      adopterName: [
        adopterSummary.get(booking.adopter_id)?.first_name,
        adopterSummary.get(booking.adopter_id)?.last_name,
      ].filter(Boolean).join(" ") || "Unknown adopter",
      adopterPhoneNumber: adopterSummary.get(booking.adopter_id)?.phone_number ?? null,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      bookingCode: booking.booking_code,
      checkedIn: Boolean(booking.checked_in_at),
      dogBreed: booking.dog_id ? dogSummary.get(booking.dog_id)?.breed ?? null : null,
      dogId: booking.dog_id,
      dogName: booking.dog_id ? dogNames.get(booking.dog_id) ?? "Dog profile" : "Shelter visit",
      id: booking.id,
      proposedAppointmentDate: (booking as { proposed_appointment_date?: string | null }).proposed_appointment_date ?? null,
      proposedAppointmentTime: (booking as { proposed_appointment_time?: string | null }).proposed_appointment_time ?? null,
      shelterDistrict: shelterSummary.get(booking.shelter_id)?.district ?? null,
      shelterId: booking.shelter_id,
      shelterName: shelterNames.get(booking.shelter_id) ?? "Unknown shelter",
      shelterNote: booking.shelter_note,
      shelterProvince: shelterSummary.get(booking.shelter_id)?.province ?? null,
      status: booking.status,
      visitorNote: booking.visitor_note,
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
      addressLine: shelter.address_line,
      availability: availabilityByShelter.get(shelter.id) ?? [],
      bankAccountName: shelter.bank_account_name,
      bankAccountNumber: shelter.bank_account_number,
      bankConfigured: Boolean(shelter.promptpay_id || shelter.bank_name || shelter.bank_account_number || shelter.bank_account_name),
      bankName: shelter.bank_name,
      description: shelter.description,
      district: shelter.district,
      dogsCount: dogsByShelter.get(shelter.id) ?? 0,
      email: shelter.email,
      facebookUrl: shelter.facebook_url,
      googleMapsUrl: shelter.google_maps_url,
      id: shelter.id,
      instagramUrl: shelter.instagram_url,
      location: [shelter.district, shelter.province].filter(Boolean).join(", ") || shelter.province || "Thailand",
      logoUrl: shelter.logo_url,
      meetingInstructions: shelter.meeting_instructions,
      name: shelter.name,
      pendingBookingsCount: pendingBookingsByShelter.get(shelter.id) ?? 0,
      phoneNumber: shelter.phone_number,
      postalCode: shelter.postal_code,
      promptpayId: shelter.promptpay_id,
      province: shelter.province,
      regularHours: regularHoursByShelter.get(shelter.id) ?? [],
      subdistrict: shelter.subdistrict,
      unreadMessageCount: messagesByShelter.get(shelter.id) ?? 0,
      websiteUrl: shelter.website_url,
    })),
    source: "supabase",
    updatedAt: new Date().toISOString(),
  };
}
