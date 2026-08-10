import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import {
  DEFAULT_AD_CREATIVE_SETTINGS,
  normalizeAdCreativeSettings,
  type AdCreativeSettings,
} from "@/utils/ad-creative-settings";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import {
  loadAppointmentMessageThreads,
  type AppointmentMessageThread,
} from "@/utils/message-threads";

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

export type AdminDraftDonation = {
  amountThb: number;
  createdAt: string;
  dogId: string;
  dogName: string;
  donorEmail: string | null;
  donorName: string;
  donorPhoneNumber: string | null;
  id: string;
  proofMimeType: string | null;
  proofOriginalFileName: string | null;
  proofSubmittedAt: string | null;
  proofUrl: string | null;
  shelterId: string;
  shelterName: string;
  shelterNote: string | null;
  status: string;
  treatCount: number;
  updatedAt: string;
  userId: string;
};

export type AdminDraftAd = {
  submissionCode: string;
  contactEmail: string | null;
  contactInfo: string | null;
  contactPhone: string | null;
  clickUrl: string;
  companyName: string;
  endDate: string;
  id: string;
  imageUrl: string;
  isActive: boolean;
  mediaType: "image" | "video";
  reviewStatus: "pending" | "approved" | "denied";
  startDate: string;
};

export type AdminDraftAdClick = {
  adId: string;
  clickedAt: string;
  destinationUrl: string;
  id: string;
  userDateOfBirth: string | null;
  userEmail: string | null;
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
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
  adCreativeSettings: AdCreativeSettings;
  adClicks: AdminDraftAdClick[];
  ads: AdminDraftAd[];
  bookings: AdminDraftBooking[];
  donations: AdminDraftDonation[];
  dogs: AdminDraftDog[];
  error: string | null;
  messageThreads: AppointmentMessageThread[];
  messagesUnavailable: boolean;
  shelters: AdminDraftShelter[];
  source: "fallback" | "supabase";
  updatedAt: string;
};

export type LoadAdminDraftDataOptions = {
  shelterIds?: string[] | null;
};

function fallbackData(error: string): AdminDraftData {
  return {
    about: null,
    adCreativeSettings: DEFAULT_AD_CREATIVE_SETTINGS,
    adClicks: [],
    ads: [],
    bookings: [],
    donations: [],
    dogs: [],
    error,
    messageThreads: [],
    messagesUnavailable: false,
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

export async function loadAdminDraftData(options: LoadAdminDraftDataOptions = {}): Promise<AdminDraftData> {
  let supabase: ReturnType<typeof createAdminClient>;

  try {
    supabase = createAdminClient();
  } catch (error) {
    return fallbackData(error instanceof Error ? error.message : "Supabase admin client is unavailable.");
  }

  const [sheltersResult, dogsResult, dogPhotosResult, bookingsResult, donationsResult, messageThreadsResult, adsResult, adClicksResult, aboutResult, availabilityResult, regularHoursResult, adCreativeSettingsResult] = await Promise.all([
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
      .select("dog_id,public_url,is_cover,sort_order,storage_path")
      .order("sort_order", { ascending: true })
      .limit(1000),
    supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .limit(200),
    supabase
      .from("donation_intents")
      .select("id,user_id,dog_id,shelter_id,treat_count,amount_thb,status,created_at,updated_at,proof_bucket_id,proof_storage_path,proof_mime_type,proof_original_file_name,proof_submitted_at,shelter_note")
      .order("created_at", { ascending: false })
      .limit(500),
    loadAppointmentMessageThreads({ shelterIds: options.shelterIds }),
    supabase
      .from("ads")
      .select("id,submission_code,company_name,contact_info,contact_email,contact_phone,image_url,media_type,click_url,is_active,ad_status,start_date,end_date")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ad_clicks")
      .select("id,ad_id,user_id,destination_url,clicked_at")
      .order("clicked_at", { ascending: false })
      .limit(1000),
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
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ads_creative_specs")
      .maybeSingle(),
  ]);

  const firstError = sheltersResult.error ?? dogsResult.error ?? dogPhotosResult.error ?? bookingsResult.error ?? donationsResult.error ?? adsResult.error ?? aboutResult.error;
  if (firstError) {
    return fallbackData(firstError.message);
  }

  const scopedShelterIds = options.shelterIds ?? null;
  const shouldScopeShelters = Array.isArray(scopedShelterIds);
  const visibleShelterIds = new Set(scopedShelterIds ?? []);
  const rawShelters = (sheltersResult.data ?? []).filter((shelter) => (
    shouldScopeShelters ? visibleShelterIds.has(shelter.id) : true
  ));
  const returnedShelterIds = new Set(rawShelters.map((shelter) => shelter.id));
  const rawDogs = (dogsResult.data ?? []).filter((dog) => (
    shouldScopeShelters ? returnedShelterIds.has(dog.shelter_id) : true
  ));
  const visibleDogIds = new Set(rawDogs.map((dog) => dog.id));
  const rawDogPhotos = (dogPhotosResult.data ?? []).filter((photo) => (
    shouldScopeShelters ? visibleDogIds.has(photo.dog_id) : true
  ));
  const rawBookings = (bookingsResult.data ?? []).filter((booking) => (
    shouldScopeShelters ? returnedShelterIds.has(booking.shelter_id) : true
  ));
  const rawDonations = (donationsResult.data ?? []).filter((donation) => (
    shouldScopeShelters ? returnedShelterIds.has(donation.shelter_id) : true
  ));
  const messageThreads = messageThreadsResult.threads.filter((thread) => (
    shouldScopeShelters ? returnedShelterIds.has(thread.shelterId) : true
  ));
  const rawAds = adsResult.data ?? [];
  const rawAdClicks = adClicksResult.error ? [] : adClicksResult.data ?? [];
  const rawAbout = aboutResult.data ?? null;
  const rawAdCreativeSettings = adCreativeSettingsResult.error ? null : adCreativeSettingsResult.data?.value;
  const rawAvailability = (availabilityResult.error ? [] : availabilityResult.data ?? []).filter((range: { shelter_id: string }) => (
    shouldScopeShelters ? returnedShelterIds.has(range.shelter_id) : true
  ));
  const rawRegularHours = (regularHoursResult.error ? [] : regularHoursResult.data ?? []).filter((hours) => (
    shouldScopeShelters ? returnedShelterIds.has(hours.shelter_id) : true
  ));
  const bookingAdopterIds = [...new Set(rawBookings.map((booking) => booking.adopter_id).filter(Boolean))];
  const donationProfileIds = [...new Set(rawDonations.map((donation) => donation.user_id).filter(Boolean))];
  const adClickProfileIds = [...new Set(rawAdClicks.map((click) => click.user_id).filter(Boolean))] as string[];
  const adoptersResult = bookingAdopterIds.length
    ? await supabase
        .from("adopters")
        .select("id,first_name,last_name,email,phone_number")
        .in("id", bookingAdopterIds)
    : { data: [], error: null };
  const [clickProfilesResult, clickAdoptersResult] = adClickProfileIds.length
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,phone_number")
          .in("id", adClickProfileIds),
        supabase
          .from("adopters")
          .select("profile_id,first_name,last_name,email,phone_number,date_of_birth")
          .in("profile_id", adClickProfileIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const [donationProfilesResult, donationAdoptersResult] = donationProfileIds.length
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,phone_number")
          .in("id", donationProfileIds),
        supabase
          .from("adopters")
          .select("profile_id,first_name,last_name,email,phone_number")
          .in("profile_id", donationProfileIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const donationProofUrls = new Map<string, string>();
  await Promise.all(rawDonations.map(async (donation) => {
    if (!donation.proof_storage_path) return;

    const { data } = await supabase.storage
      .from(donation.proof_bucket_id || "donation-slips")
      .createSignedUrl(donation.proof_storage_path, 60 * 60);
    if (data?.signedUrl) donationProofUrls.set(donation.id, data.signedUrl);
  }));

  const shelterSummary = new Map(rawShelters.map((shelter) => [shelter.id, shelter]));
  const dogSummary = new Map(rawDogs.map((dog) => [dog.id, dog]));
  const adopterSummary = new Map((adoptersResult.data ?? []).map((adopter) => [adopter.id, adopter]));
  const clickProfileSummary = new Map((clickProfilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const clickAdopterSummary = new Map((clickAdoptersResult.data ?? []).map((adopter) => [adopter.profile_id, adopter]));
  const donationProfileSummary = new Map((donationProfilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const donationAdopterSummary = new Map((donationAdoptersResult.data ?? []).map((adopter) => [adopter.profile_id, adopter]));
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
    const publicUrl = normalizeDogMediaUrl(photo.public_url, photo.storage_path);

    photoSummaryByDog.set(photo.dog_id, {
      coverUrl: photo.is_cover ? publicUrl : current.coverUrl ?? publicUrl,
      photosCount: current.photosCount + 1,
    });
  }

  for (const booking of rawBookings) {
    if (booking.status === "requested") {
      pendingBookingsByShelter.set(booking.shelter_id, (pendingBookingsByShelter.get(booking.shelter_id) ?? 0) + 1);
    }
  }

  for (const thread of messageThreads) {
    messagesByShelter.set(thread.shelterId, (messagesByShelter.get(thread.shelterId) ?? 0) + thread.unreadForShelterCount);
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
    adCreativeSettings: normalizeAdCreativeSettings(rawAdCreativeSettings),
    adClicks: rawAdClicks.map((click) => {
      const adopter = click.user_id ? clickAdopterSummary.get(click.user_id) : null;
      const profile = click.user_id ? clickProfileSummary.get(click.user_id) : null;

      return {
        adId: click.ad_id,
        clickedAt: click.clicked_at,
        destinationUrl: click.destination_url,
        id: click.id,
        userDateOfBirth: adopter?.date_of_birth ?? null,
        userEmail: adopter?.email ?? null,
        userId: click.user_id,
        userName: ([
          adopter?.first_name,
          adopter?.last_name,
        ].filter(Boolean).join(" ") || profile?.full_name) ?? null,
        userPhone: adopter?.phone_number ?? profile?.phone_number ?? null,
      };
    }),
    ads: rawAds.map((ad) => ({
      clickUrl: ad.click_url,
      companyName: ad.company_name,
      contactEmail: ad.contact_email,
      contactInfo: ad.contact_info,
      contactPhone: ad.contact_phone,
      endDate: ad.end_date,
      id: ad.id,
      imageUrl: normalizeDogMediaUrl(ad.image_url) ?? ad.image_url,
      isActive: ad.is_active,
      mediaType: ad.media_type ?? "image",
      reviewStatus: ad.ad_status,
      startDate: ad.start_date,
      submissionCode: ad.submission_code,
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
    donations: rawDonations.map((donation) => {
      const adopter = donationAdopterSummary.get(donation.user_id);
      const profile = donationProfileSummary.get(donation.user_id);
      const donorName = [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ")
        || profile?.full_name
        || "Unknown donor";

      return {
        amountThb: donation.amount_thb,
        createdAt: donation.created_at,
        dogId: donation.dog_id,
        dogName: dogNames.get(donation.dog_id) ?? "Dog profile",
        donorEmail: adopter?.email ?? null,
        donorName,
        donorPhoneNumber: adopter?.phone_number ?? profile?.phone_number ?? null,
        id: donation.id,
        proofMimeType: donation.proof_mime_type,
        proofOriginalFileName: donation.proof_original_file_name,
        proofSubmittedAt: donation.proof_submitted_at,
        proofUrl: donationProofUrls.get(donation.id) ?? null,
        shelterId: donation.shelter_id,
        shelterName: shelterNames.get(donation.shelter_id) ?? "Unknown shelter",
        shelterNote: donation.shelter_note,
        status: donation.status,
        treatCount: donation.treat_count,
        updatedAt: donation.updated_at,
        userId: donation.user_id,
      };
    }),
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
    messageThreads,
    messagesUnavailable: messageThreadsResult.messagesUnavailable,
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
