"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdCard from "@/components/AdCard";
import {
  Bone,
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FileCheck2,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  PawPrint,
  PlusCircle,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  APPOINTMENT_TIME_SLOTS,
  appointmentFollowUpDue,
  isPastAppointmentByTime,
  normalizeAppointmentTime,
} from "@/utils/appointments-model";
import {
  bookingWorkspaceCheckInHref,
  bookingWorkspaceDetailHref,
  bookingWorkspaceVisitorHref,
} from "@/utils/booking-workspace-routes";
import {
  toggleAdAction,
  updateAdCreativeSettingsFromFormAction,
  updateAdDatesFromFormAction,
  updateAdReviewStatusAction,
} from "@/app/admin/ads/actions";
import {
  createShelterBlockoutAction,
  deleteShelterAvailabilityAction,
  decideBookingAction,
  reviewDonationAction,
  toggleShelterBlockoutDateAction,
  updateShelterDonationDetailsAction,
  updateShelterOperatingDaysAction,
  updateShelterProfileAction,
} from "@/app/admin/bookings/actions";
import { sendShelterAppointmentMessageAction, signOutShelterPortalAction } from "@/app/shelter/actions";
import DonationDetailsFields from "@/app/admin/bookings/DonationDetailsFields";
import BookingQrScanner from "@/app/admin/bookings/BookingQrScanner";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import {
  adDisplayStatusLabel,
  getAdDisplayStatus,
  OPEN_ENDED_AD_END_DATE,
  type AdDisplayStatus,
} from "@/utils/ad-workflow";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import type {
  AdminDraftAboutContent,
  AdminDraftAd,
  AdminDraftAdClick,
  AdminDraftData,
  AdminDraftBooking,
  AdminDraftDog,
  AdminDraftDonation,
  AdminDraftShelter,
} from "@/utils/admin-draft-data";

type RoleView = "pawjai" | "shelter";
type MainTab = "shelters" | "dogs" | "bookings" | "donations" | "ads" | "about";
type ShelterTab = "profile" | "dogs" | "bookings" | "donations" | "messages";
type DogRecordView = "current" | "adopted" | "all";
type BookingWorkspaceView = "visits" | "calendar";
type VisitBucket = "upcoming" | "needs_follow_up" | "past" | "all";
type MessageFilter = "all" | "unread" | "upcoming" | "needs_reply";
type AdStatusFilter = "all" | AdDisplayStatus;
type AdWorkspaceView = "review" | "analytics";
type AdminDraftMessageThread = AdminDraftData["messageThreads"][number];

const DRAFT_RETURN_TO = "/admindraft";
const ADS_DRAFT_RETURN_TO = "/admindraft?view=ads";
const MESSAGE_THREAD_REFRESH_INTERVAL_MS = 12_000;
const MAIN_TABS: MainTab[] = ["shelters", "dogs", "bookings", "donations", "ads", "about"];
const BOOKING_STATUS_OPTIONS = ["requested", "confirmed", "completed", "cancelled", "no_show"];
const AD_STATUS_TABS: { label: string; value: AdStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending review", value: "pending" },
  { label: "Live", value: "approved" },
  { label: "Paused", value: "paused" },
  { label: "Denied", value: "denied" },
  { label: "Expired", value: "expired" },
];
const VISIT_BUCKETS: { label: string; value: VisitBucket }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Needs follow-up", value: "needs_follow_up" },
  { label: "Past", value: "past" },
  { label: "All", value: "all" },
];
const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function withReturnTo(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function adminDraftShelterWorkspaceHref(shelterId: string, view: ShelterTab, roleView?: RoleView) {
  const params = new URLSearchParams({ shelter: shelterId, view });
  if (roleView === "shelter") params.set("role", "shelter");
  return `/admindraft?${params.toString()}`;
}

function adminDraftShelterCreateDogHref(shelterId: string, roleView?: RoleView) {
  const params = new URLSearchParams({ shelter: shelterId });
  if (roleView === "shelter") params.set("role", "shelter");
  return `/admindraft/dog-creation?${params.toString()}`;
}

function adminDraftDogEditHref(dogId: string, roleView?: RoleView) {
  const params = new URLSearchParams();
  if (roleView === "shelter") params.set("role", "shelter");
  const query = params.toString();
  return query ? `/admindraft/dogs/${dogId}/edit?${query}` : `/admindraft/dogs/${dogId}/edit`;
}

function isMainTab(value: string | undefined): value is MainTab {
  return MAIN_TABS.includes(value as MainTab);
}

const fallbackShelters: AdminDraftShelter[] = [
  {
    address: "Bangkok",
    bankConfigured: true,
    description: "Sample shelter row shown when Supabase data is unavailable.",
    district: "Bangkok",
    dogsCount: 17,
    email: "shelter@example.org",
    googleMapsUrl: null,
    id: "voice",
    location: "Bangkok",
    logoUrl: null,
    meetingInstructions: "Meet at the front desk.",
    name: "The Voice Foundation",
    pendingBookingsCount: 2,
    phoneNumber: "02-000-0000",
    province: "Bangkok",
    unreadMessageCount: 3,
    websiteUrl: null,
  },
  {
    address: "Nonthaburi",
    bankConfigured: false,
    description: null,
    district: "Nonthaburi",
    dogsCount: 8,
    email: null,
    googleMapsUrl: null,
    id: "home",
    location: "Nonthaburi",
    logoUrl: null,
    meetingInstructions: null,
    name: "Home for Hope",
    pendingBookingsCount: 1,
    phoneNumber: null,
    province: "Nonthaburi",
    unreadMessageCount: 0,
    websiteUrl: null,
  },
  {
    address: "Chiang Mai",
    bankConfigured: false,
    description: null,
    district: "Chiang Mai",
    dogsCount: 12,
    email: null,
    googleMapsUrl: null,
    id: "soul",
    location: "Chiang Mai",
    logoUrl: null,
    meetingInstructions: null,
    name: "Soul Shelter",
    pendingBookingsCount: 0,
    phoneNumber: null,
    province: "Chiang Mai",
    unreadMessageCount: 0,
    websiteUrl: null,
  },
];

const fallbackDogs: AdminDraftDog[] = [
  { breed: "Mixed breed", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "won", name: "วอน", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "available", updatedAt: "" },
  { breed: "Thai mix", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "yala", name: "ยะลา (yala)", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "available", updatedAt: "" },
  { breed: "Mixed breed", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "ploy", name: "พลอย (Ploy)", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "reserved", updatedAt: "" },
  { breed: "Mixed breed", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "tua-daang", name: "ตัวแดง (Tua Daang)", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "draft", updatedAt: "" },
  { breed: "Mixed breed", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "tong-dum", name: "ทองดำ (Tong Dum)", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "adopted", updatedAt: "" },
  { breed: "Mixed breed", coverUrl: null, createdAt: "", energyLevel: null, gender: "unknown", id: "butcher", name: "Butcher", photosCount: 0, shelterId: "voice", shelterName: "The Voice Foundation", size: null, status: "available", updatedAt: "" },
];

const fallbackBookings: AdminDraftBooking[] = [
  {
    adopterEmail: "proudxd@gmail.com",
    adopterId: "adopter-1",
    adopterName: "Polchaya Sudlabha",
    adopterPhoneNumber: "0970974747",
    appointmentDate: "2026-07-23",
    appointmentTime: "16:00",
    bookingCode: "APT-D5A8A",
    checkedIn: false,
    dogBreed: "Ridgeback",
    dogId: "won",
    dogName: "วอน",
    id: "booking-1",
    proposedAppointmentDate: null,
    proposedAppointmentTime: null,
    shelterDistrict: "Bangkok",
    shelterId: "voice",
    shelterName: "The Voice Foundation",
    shelterNote: null,
    shelterProvince: "Bangkok",
    status: "confirmed",
    visitorNote: "Tester",
  },
  {
    adopterEmail: "proudxd@gmail.com",
    adopterId: "adopter-1",
    adopterName: "Polchaya Sudlabha",
    adopterPhoneNumber: "0970974747",
    appointmentDate: "2026-07-30",
    appointmentTime: "11:00",
    bookingCode: "APT-86496",
    checkedIn: false,
    dogBreed: "Poodle Terrier Mix",
    dogId: "tua-daang",
    dogName: "ตัวแดง (Tua Daang)",
    id: "booking-2",
    proposedAppointmentDate: "2026-07-30",
    proposedAppointmentTime: "11:00",
    shelterDistrict: "Bangkok",
    shelterId: "voice",
    shelterName: "The Voice Foundation",
    shelterNote: null,
    shelterProvince: "Bangkok",
    status: "requested",
    visitorNote: null,
  },
];

const profileFields = [
  "Shelter logo",
  "Shelter name",
  "Phone number",
  "Email",
  "Website",
  "Google Maps URL",
  "Address",
  "Meeting instructions",
  "Description",
  "Donation details",
];

const bookingActions = [
  "Filter by date",
  "Filter by status",
  "Search booking code",
  "Accept booking",
  "Deny booking",
  "Ask to change date/time",
  "Mark visit completed",
  "Visitor did not show",
  "Mark dog adopted",
  "Send shelter reply",
  "QR check-in",
];

function PillButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
        active
          ? "border-[#cd8188] bg-[#cd8188] text-white shadow-[0_10px_22px_rgba(205,129,136,0.22)]"
          : "border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Section({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white/95 p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
      <div className="pointer-events-none absolute right-5 top-5 hidden items-center gap-2 text-[#d6c8ad]/55 sm:flex" aria-hidden="true">
        <Bone className="h-5 w-5 rotate-[-18deg]" />
        <PawPrint className="h-5 w-5 rotate-12" />
      </div>
      <div className="relative">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cd8188]">{eyebrow}</p> : null}
        <h2 className={eyebrow ? "mt-2 text-2xl font-semibold text-[#65584f]" : "text-2xl font-semibold text-[#65584f]"}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function FieldGrid({ fields }: { fields: string[] }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm font-semibold text-[#65584f]" key={field}>
          {field}
        </div>
      ))}
    </div>
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBookingDisplayCode(booking: AdminDraftBooking) {
  if (booking.bookingCode) return booking.bookingCode;
  const compact = booking.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `APT-${compact.slice(0, 5)}`;
}

function normalizeBookingSearch(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!compact) return "";
  return compact.startsWith("APT") ? `APT-${compact.slice(3)}` : `APT-${compact}`;
}

function formatBookingDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
}

function formatBookingTime(time: string) {
  return new Date(`1970-01-01T${normalizeAppointmentTime(time)}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageTime(value: string | null | undefined) {
  if (!value) return "No messages yet";
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function formatBackendMessageTimestamp(value: string | null | undefined) {
  if (!value) return "No backend timestamp";
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBackendMessageTimestampTitle(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function isPreviewableMessageImage(type: string | null | undefined) {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}

function isPreviewableMessageVideo(type: string | null | undefined) {
  return type === "video/mp4" || type === "video/quicktime";
}

function bookingStatusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "completed":
      return "bg-[#e9f2ff] text-[#285f9d]";
    case "cancelled":
      return "bg-[#f7e3e1] text-[#9a3129]";
    case "no_show":
      return "bg-[#f1e7db] text-[#65584f]";
    default:
      return "bg-[#f8e8ea] text-[#cd8188]";
  }
}

function adStatusClass(status: AdDisplayStatus) {
  switch (status) {
    case "approved":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "denied":
      return "bg-[#f7e3e1] text-[#9a3129]";
    case "paused":
      return "bg-[#f1e7db] text-[#65584f]";
    case "expired":
      return "bg-[#fbe8e8] text-[#9b3a32]";
    default:
      return "bg-[#f8e8ea] text-[#cd8188]";
  }
}

function bookingDecisionLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "Accepted";
    case "cancelled":
      return "Denied";
    case "completed":
      return "Completed";
    case "no_show":
      return "No show";
    default:
      return "Awaiting decision";
  }
}

function bookingDogLabel(booking: AdminDraftBooking) {
  return `${booking.dogName}${booking.dogBreed ? ` - ${booking.dogBreed}` : ""}`;
}

function matchesBookingFilters({
  booking,
  date,
  search,
  status,
  visitBucket,
}: {
  booking: AdminDraftBooking;
  date: string;
  search: string;
  status: string;
  visitBucket: VisitBucket;
}) {
  const normalizedSearch = normalizeBookingSearch(search);
  const displayCode = formatBookingDisplayCode(booking).toUpperCase();
  const now = new Date();
  const followUpDue = appointmentFollowUpDue({
    appointment_date: booking.appointmentDate,
    appointment_time: booking.appointmentTime,
    status: booking.status,
  }, now);
  const isPast = isPastAppointmentByTime({
    appointment_date: booking.appointmentDate,
    appointment_time: booking.appointmentTime,
    status: booking.status,
  }, now);

  if (date && booking.appointmentDate !== date) return false;
  if (status !== "all" && booking.status !== status) return false;
  if (normalizedSearch && !displayCode.startsWith(normalizedSearch)) return false;
  if (date || status !== "all" || normalizedSearch) return true;
  if (visitBucket === "past") return isPast;
  if (visitBucket === "needs_follow_up") return followUpDue;
  if (visitBucket === "all") return true;
  return !isPast;
}

function matchesDogFilters(dog: AdminDraftDog, search: string, status: string) {
  const query = search.trim().toLowerCase();
  const searchable = [dog.name, dog.breed, dog.shelterName, dog.gender, dog.size, dog.energyLevel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (!query || searchable.includes(query)) && (status === "all" || dog.status === status);
}

function matchesAdFilters(ad: AdminDraftAd, search: string, status: AdStatusFilter, today: string) {
  const query = search.trim().toLowerCase();
  const searchable = [ad.submissionCode, ad.companyName, ad.clickUrl, ad.contactEmail, ad.contactPhone, ad.contactInfo, ad.startDate, ad.endDate]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const adStatus = getAdDisplayStatus({
    endDate: ad.endDate,
    isActive: ad.isActive,
    reviewStatus: ad.reviewStatus,
    today,
  });

  return (!query || searchable.includes(query)) && (status === "all" || adStatus === status);
}

function getAdLiveDays(ad: AdminDraftAd, today: string) {
  if (ad.reviewStatus !== "approved") return 0;
  const start = new Date(`${ad.startDate}T00:00:00`);
  const endKey = ad.endDate < today ? ad.endDate : today;
  const end = new Date(`${endKey}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function formatClickDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function getAgeFromDateOfBirth(value: string | null) {
  if (!value) return null;
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function buildAdClickBuckets(clicks: AdminDraftAdClick[], today: string, days = 14) {
  const end = new Date(`${today}T00:00:00`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      count: clicks.filter((click) => click.clickedAt.slice(0, 10) === key).length,
      key,
      label: date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    };
  });
}

function matchesMessageThread(thread: AdminDraftMessageThread, messageSearch: string, messageFilter: MessageFilter) {
  const query = messageSearch.trim().toLowerCase();

  if (query && !thread.searchableText.includes(query)) return false;
  if (messageFilter === "unread") return thread.unreadForShelterCount > 0;
  if (messageFilter === "needs_reply") return thread.needsReply;
  if (messageFilter === "upcoming") {
    const visitDate = new Date(`${thread.appointmentDate}T${thread.appointmentTime || "00:00"}`);
    return Number.isNaN(visitDate.getTime()) ? true : visitDate >= new Date();
  }
  return true;
}

function shelterFilterOptions(shelters: AdminDraftShelter[]) {
  return [{ id: "all", name: "All shelters" }, ...shelters.map((shelter) => ({ id: shelter.id, name: shelter.name }))];
}

function shelterAddressParts(shelter: AdminDraftShelter) {
  return [
    shelter.addressLine,
    shelter.subdistrict,
    shelter.district,
    shelter.province,
    shelter.postalCode,
  ].filter(Boolean) as string[];
}

function shelterMapsUrl(shelter: AdminDraftShelter) {
  if (shelter.googleMapsUrl) return shelter.googleMapsUrl;
  const query = [shelter.name, ...shelterAddressParts(shelter)].filter(Boolean).join(" ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function buildCalendarDays(monthStart: Date) {
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DraftReturnFields({ returnTo = DRAFT_RETURN_TO, shelterId }: { returnTo?: string; shelterId: string }) {
  return (
    <>
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="shelterId" type="hidden" value={shelterId} />
    </>
  );
}

function DogCard({ dog, editHref }: { dog: AdminDraftDog; editHref: string }) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-[#d6c8ad] bg-white shadow-[0_10px_28px_rgba(101,88,79,0.08)]">
      <div className="flex aspect-[16/9] items-center justify-center bg-[#d6c8ad] text-[#65584f]">
        {dog.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${dog.name} cover`} className="h-full w-full object-cover" src={dog.coverUrl} />
        ) : (
          <PawPrint className="h-8 w-8" />
        )}
      </div>
      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#65584f]">{dog.name}</h3>
          <p className="mt-1 text-sm text-[#65584f]">{dog.breed}</p>
        </div>
        <span className="rounded-full bg-[#d6c8ad] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#65584f]">
          {formatStatus(dog.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#65584f]">{dog.shelterName}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#65584f]">
        <span>{dog.photosCount} photos</span>
        {dog.gender ? <span>{formatStatus(dog.gender)}</span> : null}
        {dog.size ? <span>{formatStatus(dog.size)}</span> : null}
        {dog.energyLevel ? <span>{formatStatus(dog.energyLevel)}</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          className="inline-flex items-center justify-center rounded-full bg-[#cd8188] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b87179]"
          href={editHref}
        >
          Edit
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
          href={`/dogs/${dog.id}`}
        >
          Open
        </Link>
      </div>
      </div>
    </article>
  );
}

function ShelterWorkspaceTabButton({
  active,
  adminMode,
  children,
  href,
  icon,
  meta,
  onClick,
}: {
  active: boolean;
  adminMode: boolean;
  children: React.ReactNode;
  href?: string;
  icon: React.ReactNode;
  meta: string;
  onClick: () => void;
}) {
  if (adminMode) {
    return (
      <PillButton active={active} onClick={onClick}>
        {children}
      </PillButton>
    );
  }

  const className = `flex aspect-square min-h-32 flex-col justify-between rounded-2xl border p-4 text-left transition ${
    active
      ? "border-[#cd8188] bg-[#f8e8ea] text-[#65584f] shadow-[0_12px_28px_rgba(205,129,136,0.18)]"
      : "border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]"
  }`;
  const content = (
    <>
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
        active ? "bg-white text-[#cd8188]" : "bg-[#f5f1e8] text-[#cd8188]"
      }`}>
        {icon}
      </span>
      <span>
        <span className="block text-base font-semibold">{children}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#65584f]">{meta}</span>
      </span>
    </>
  );

  return href ? (
    <Link className={className} href={href} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  );
}

function ShelterWorkspaceLinkTab({
  adminMode,
  children,
  href,
  icon,
  meta,
}: {
  adminMode: boolean;
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
  meta: string;
}) {
  if (adminMode) {
    return (
      <Link
        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2 text-center text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
        href={href}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      className="flex aspect-square min-h-32 flex-col justify-between rounded-2xl border border-[#d6c8ad] bg-white p-4 text-left text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
      href={href}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#cd8188]">
        {icon}
      </span>
      <span>
        <span className="block text-base font-semibold">{children}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#65584f]">{meta}</span>
      </span>
    </Link>
  );
}

function ShelterProfileTab({ returnTo, shelter }: { returnTo: string; shelter: AdminDraftShelter }) {
  const addressParts = shelterAddressParts(shelter);
  const mapsUrl = shelterMapsUrl(shelter);
  const inputClass = "w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]";
  const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]";

  return (
    <div className="space-y-6">
      <Section eyebrow="Shelter profile" title={shelter.name}>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p className="text-sm leading-6 text-[#65584f]">
              This profile feeds meeting location and shelter contact details.
            </p>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#d6c8ad] text-[#65584f]">
                {shelter.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${shelter.name} logo`} className="h-full w-full object-cover" src={shelter.logoUrl} />
                ) : (
                  <ImageIcon className="h-7 w-7" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#65584f]">Shelter logo</p>
                <p className="mt-1 text-xs leading-5 text-[#65584f]">
                  Paste a hosted logo URL or upload a new PNG, JPG, or WEBP file.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-[#f8f0e5] p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-[#65584f]" size={18} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Meeting at</p>
                    <p className="mt-1 text-base font-semibold text-[#65584f]">{shelter.name}</p>
                    <p className="mt-1 text-sm leading-6 text-[#65584f]">
                      {addressParts.length > 0 ? addressParts.join(", ") : "No address set yet."}
                    </p>
                    {mapsUrl ? (
                      <a
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#c97580] hover:text-[#ad5f6a]"
                        href={mapsUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open Google Maps
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                    {shelter.meetingInstructions ? (
                      <p className="mt-2 text-xs leading-5 text-[#65584f]">{shelter.meetingInstructions}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8f0e5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Shelter contact</p>
                <div className="mt-3 grid gap-2 text-sm text-[#65584f]">
                  <p>{shelter.phoneNumber || "No phone number set"}</p>
                  <p className="inline-flex items-center gap-2">
                    <Mail size={15} />
                    {shelter.email || "No email set"}
                  </p>
                  {shelter.websiteUrl ? (
                    <a
                      className="inline-flex items-center gap-2 font-semibold text-[#c97580] hover:text-[#ad5f6a]"
                      href={shelter.websiteUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Globe size={15} />
                      Shelter website
                    </a>
                  ) : (
                    <p className="inline-flex items-center gap-2">
                      <Globe size={15} />
                      No website set
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form action={updateShelterProfileAction} className="grid gap-3">
            <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Shelter name</span>
                <input className={inputClass} defaultValue={shelter.name} name="name" required />
              </label>
              <label>
                <span className={labelClass}>Phone</span>
                <input className={inputClass} defaultValue={shelter.phoneNumber ?? ""} name="phoneNumber" />
              </label>
              <label>
                <span className={labelClass}>Email for booking notifications</span>
                <input className={inputClass} defaultValue={shelter.email ?? ""} name="email" type="email" />
              </label>
              <label>
                <span className={labelClass}>Website</span>
                <input className={inputClass} defaultValue={shelter.websiteUrl ?? ""} name="websiteUrl" placeholder="https://example.org" />
              </label>
              <label>
                <span className={labelClass}>Logo URL</span>
                <input className={inputClass} defaultValue={shelter.logoUrl ?? ""} name="logoUrl" placeholder="https://.../logo.png" />
              </label>
              <label>
                <span className={labelClass}>Upload logo</span>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-2.5 text-sm text-[#65584f] file:mr-3 file:rounded-full file:border-0 file:bg-[#cd8188] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#cd8188]"
                  name="logoFile"
                  type="file"
                />
              </label>
              <label>
                <span className={labelClass}>Google Maps URL</span>
                <input className={inputClass} defaultValue={shelter.googleMapsUrl ?? ""} name="googleMapsUrl" placeholder="https://maps.google.com/..." />
              </label>
            </div>

            <label>
              <span className={labelClass}>Address</span>
              <input className={inputClass} defaultValue={shelter.addressLine ?? ""} name="addressLine" placeholder="Street address / meeting entrance" />
            </label>

            <div className="grid gap-3 md:grid-cols-4">
              <label>
                <span className={labelClass}>Subdistrict</span>
                <input className={inputClass} defaultValue={shelter.subdistrict ?? ""} name="subdistrict" />
              </label>
              <label>
                <span className={labelClass}>District</span>
                <input className={inputClass} defaultValue={shelter.district ?? ""} name="district" />
              </label>
              <label>
                <span className={labelClass}>Province</span>
                <input className={inputClass} defaultValue={shelter.province ?? ""} name="province" />
              </label>
              <label>
                <span className={labelClass}>Postal code</span>
                <input className={inputClass} defaultValue={shelter.postalCode ?? ""} name="postalCode" />
              </label>
            </div>

            <label>
              <span className={labelClass}>Meeting instructions</span>
              <textarea className={`${inputClass} min-h-20 resize-none`} defaultValue={shelter.meetingInstructions ?? ""} name="meetingInstructions" placeholder="Gate, parking, front desk, or what visitors should say when they arrive" />
            </label>

            <input name="facebookUrl" type="hidden" value={shelter.facebookUrl ?? ""} />
            <input name="instagramUrl" type="hidden" value={shelter.instagramUrl ?? ""} />
            <button className="mt-1 inline-flex items-center justify-center rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">
              Save shelter profile
            </button>
          </form>
        </div>
      </Section>
    </div>
  );
}

function ShelterCalendar({ returnTo, shelter }: { returnTo: string; shelter: AdminDraftShelter }) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const unavailableRanges = Array.from(new Map(
    (shelter.availability ?? [])
      .filter((range) => range.availabilityType === "unavailable")
      .map((range) => [`${range.startDate}:${range.endDate}:${range.note ?? ""}`, range]),
  ).values());
  const regularHours = shelter.regularHours ?? [];
  const fallbackClosedDays = unavailableRanges
    .map((range) => range.note?.match(/^Recurring weekly closure:(\d)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  const closedDays = new Set([
    ...regularHours.filter((hours) => hours.isClosed).map((hours) => hours.dayOfWeek),
    ...fallbackClosedDays,
  ]);
  const sampleOpenDay = regularHours.find((hours) => !hours.isClosed);
  const defaultOpensAt = sampleOpenDay?.opensAt?.slice(0, 5) ?? "10:00";
  const defaultClosesAt = sampleOpenDay?.closesAt?.slice(0, 5) ?? "17:00";
  const defaultSlotDuration = sampleOpenDay?.slotDurationMinutes ?? regularHours[0]?.slotDurationMinutes ?? 60;
  const calendarDays = buildCalendarDays(calendarMonth);
  const previousCalendarMonth = new Date(calendarMonth);
  previousCalendarMonth.setMonth(calendarMonth.getMonth() - 1);
  const nextCalendarMonth = new Date(calendarMonth);
  nextCalendarMonth.setMonth(calendarMonth.getMonth() + 1);
  const inputClass = "w-full rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]";
  const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]";

  return (
    <Section eyebrow="Shelter calendar" title="Blockout dates">
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div>
          <p className="text-sm leading-6 text-[#65584f]">
            Close one date, a date range, or the same weekday every week. These closures immediately remove booking slots from the adopter calendar.
          </p>
          <form action={updateShelterOperatingDaysAction} className="mt-5 rounded-2xl bg-[#fffaf5] p-4">
            <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Weekly closed days</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <label className="cursor-pointer rounded-2xl border border-[#d6c8ad] bg-white px-3 py-3 text-center text-xs font-semibold text-[#65584f] has-[:checked]:border-[#c46f75] has-[:checked]:bg-[#c46f75] has-[:checked]:text-white" key={day.value}>
                  <input className="sr-only" defaultChecked={closedDays.has(day.value)} name="closedDays" type="checkbox" value={day.value} />
                  {day.label}
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label><span className={labelClass}>Opens</span><input className={inputClass} defaultValue={defaultOpensAt} name="opensAt" step="1800" type="time" /></label>
              <label><span className={labelClass}>Closes</span><input className={inputClass} defaultValue={defaultClosesAt} name="closesAt" step="1800" type="time" /></label>
              <label><span className={labelClass}>Slot minutes</span><input className={inputClass} defaultValue={defaultSlotDuration} max="240" min="15" name="slotDuration" step="15" type="number" /></label>
            </div>
            <button className="mt-4 w-full rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">Save weekly schedule</button>
          </form>
        </div>

        <div>
          <div className="rounded-2xl bg-[#fffaf5] p-4">
            <div className="flex items-center justify-between gap-3">
              <button aria-label="Previous month" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]" onClick={() => setCalendarMonth(previousCalendarMonth)} type="button"><ChevronLeft size={18} /></button>
              <p className="text-lg font-semibold text-[#65584f]">{formatMonthLabel(calendarMonth)}</p>
              <button aria-label="Next month" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]" onClick={() => setCalendarMonth(nextCalendarMonth)} type="button"><ChevronRight size={18} /></button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#65584f]">
              {WEEKDAYS.map((day) => <span key={day.value}>{day.label}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((date) => {
                const dateKey = isoDate(date);
                const inMonth = date.getMonth() === calendarMonth.getMonth();
                const recurringClosed = closedDays.has(date.getDay());
                const blockout = unavailableRanges.find((range) => (
                  !range.note?.startsWith("Recurring weekly closure:")
                  && dateKey >= range.startDate
                  && dateKey <= range.endDate
                ));
                const isClosed = recurringClosed || Boolean(blockout);
                return (
                  <form action={toggleShelterBlockoutDateAction} key={dateKey}>
                    <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
                    <input name="date" type="hidden" value={dateKey} />
                    <input name="availabilityId" type="hidden" value={blockout?.id ?? ""} />
                    <button className={`flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${isClosed ? "border-[#65584f] bg-[#65584f] text-white" : "border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]"} ${inMonth ? "" : "opacity-35"} ${recurringClosed ? "cursor-not-allowed" : ""}`} disabled={recurringClosed} title={recurringClosed ? "Recurring closed day" : blockout ? "Click to reopen this date" : "Click to block this date"} type="submit">
                      {date.getDate()}
                    </button>
                  </form>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#65584f]">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#65584f]" /> Closed</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded border border-[#d6c8ad] bg-white" /> Open</span>
            </div>
          </div>

          <form action={createShelterBlockoutAction} className="mt-4 grid gap-3 rounded-2xl bg-[#fffaf5] p-4 md:grid-cols-[1fr_1fr_minmax(0,1.3fr)_auto] md:items-end">
            <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
            <label><span className={labelClass}>From</span><input className={inputClass} name="startDate" required type="date" /></label>
            <label><span className={labelClass}>To</span><input className={inputClass} name="endDate" type="date" /></label>
            <label><span className={labelClass}>Reason</span><input className={inputClass} maxLength={180} name="note" placeholder="Holiday, staff training, fully booked" required /></label>
            <button className="rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">Add</button>
          </form>

          <div className="mt-4 grid gap-2">
            {unavailableRanges.length > 0 ? unavailableRanges.map((range) => (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between" key={range.id}>
                <div>
                  <p className="text-sm font-semibold text-[#65584f]">{formatShortDate(range.startDate)}{range.endDate !== range.startDate ? ` - ${formatShortDate(range.endDate)}` : ""}</p>
                  <p className="mt-1 text-xs leading-5 text-[#65584f]">{range.note?.startsWith("Recurring weekly closure:") ? "Weekly closure" : range.note || "Unavailable"}</p>
                </div>
                <form action={deleteShelterAvailabilityAction}>
                  <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
                  <input name="availabilityId" type="hidden" value={range.id} />
                  <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-xs font-semibold text-[#9a3129] hover:bg-[#fff6f4]" type="submit"><Trash2 size={14} />Remove</button>
                </form>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] px-4 py-5 text-sm text-[#65584f]">No blockout dates set for {shelter.name}.</div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function ShelterDogsTab({
  dogEditHref,
  dogs,
  shelter,
}: {
  dogEditHref: (dog: AdminDraftDog) => string;
  dogs: AdminDraftDog[];
  shelter: AdminDraftShelter;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [recordView, setRecordView] = useState<DogRecordView>("current");
  const currentStatuses = new Set(["available", "draft", "reserved", "unavailable"]);
  const adoptedStatuses = new Set(["adopted"]);
  const viewCounts = {
    all: dogs.length,
    current: dogs.filter((dog) => currentStatuses.has(dog.status)).length,
    adopted: dogs.filter((dog) => adoptedStatuses.has(dog.status)).length,
  };
  const filteredDogs = dogs.filter((dog) => (
    matchesDogFilters(dog, search, status)
    && (recordView === "all"
      || (recordView === "current" ? currentStatuses.has(dog.status) : adoptedStatuses.has(dog.status)))
  ));

  return (
    <div className="space-y-6">
      <Section eyebrow="Dog listings" title={`Dogs at ${shelter.name}`}>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#65584f]">
            Shelter staff can manage their own dogs here. PawJai HQ can see the same list from the shelter umbrella.
          </p>
        </div>
        <div className="mt-5 grid gap-2 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-2 sm:grid-cols-3">
          {([
            ["current", "Current dogs"],
            ["adopted", "Adopted dogs"],
            ["all", "All records"],
          ] as const).map(([value, label]) => (
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${recordView === value ? "bg-[#cd8188] text-white" : "bg-white text-[#65584f] hover:bg-[#f5f1e8]"}`}
              key={value}
              onClick={() => {
                setRecordView(value);
                setStatus("all");
              }}
              type="button"
            >
              {label} ({viewCounts[value]})
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="sr-only" htmlFor="shelter-dog-search">Search shelter dogs</label>
          <input
            className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            id="shelter-dog-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dog name, breed, size"
            type="search"
            value={search}
          />
          <label className="sr-only" htmlFor="shelter-dog-status">Filter by status</label>
          <select
            className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            id="shelter-dog-status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="draft">Draft</option>
            <option value="reserved">Reserved</option>
            <option value="adopted">Adopted</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <button
            className="rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f]"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setRecordView("current");
            }}
            type="button"
          >
            Reset
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredDogs.map((dog) => (
            <DogCard dog={dog} editHref={dogEditHref(dog)} key={dog.id} />
          ))}
          {filteredDogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-sm text-[#65584f]">
              No dog listings match this view for {shelter.name}.
            </div>
          ) : null}
        </div>
      </Section>

    </div>
  );
}

function ShelterDonationSettings({ returnTo, shelter }: { returnTo: string; shelter: AdminDraftShelter }) {
  return (
    <Section eyebrow="Donation settings" title="Payment details and QR code">
      <p className="mt-2 text-sm leading-6 text-[#65584f]">
        Add the shelter PromptPay or bank details shown to donors. Donation records and uploaded transfer slips stay in the ledger below.
      </p>
      <form action={updateShelterDonationDetailsAction} className="mt-5">
        <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
        <DonationDetailsFields
          bankAccountName={shelter.bankAccountName ?? null}
          bankAccountNumber={shelter.bankAccountNumber ?? null}
          bankName={shelter.bankName ?? null}
          promptpayId={shelter.promptpayId ?? null}
        />
        <button className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">
          Save donation payment details
        </button>
      </form>
    </Section>
  );
}

function ShelterBookingsTab({
  bookingListHref,
  bookings,
  calendarReturnTo,
  checkInHref,
  initialView = "visits",
  shelter,
}: {
  bookingListHref: string;
  bookings: AdminDraftBooking[];
  calendarReturnTo: string;
  checkInHref: string;
  initialView?: BookingWorkspaceView;
  shelter: AdminDraftShelter;
}) {
  const workspaceView = initialView;

  return (
    <div className="space-y-6">
      <div className="grid gap-2 rounded-[24px] border border-[#d6c8ad] bg-white p-3 sm:grid-cols-2">
        <Link
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${workspaceView === "visits" ? "bg-[#cd8188] text-white" : "bg-[#fffaf5] text-[#65584f] hover:bg-[#f5f1e8]"}`}
          href={bookingListHref}
        >
          <CalendarDays size={17} />
          Booking visits
        </Link>
        <Link
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${workspaceView === "calendar" ? "bg-[#cd8188] text-white" : "bg-[#fffaf5] text-[#65584f] hover:bg-[#f5f1e8]"}`}
          href={calendarReturnTo}
        >
          <CalendarDays size={17} />
          Shelter calendar
        </Link>
      </div>

      {workspaceView === "visits" ? (
        <ShelterBookingVisitList bookingListHref={bookingListHref} bookings={bookings} checkInHref={checkInHref} />
      ) : (
        <ShelterCalendar returnTo={calendarReturnTo} shelter={shelter} />
      )}
    </div>
  );
}

function ShelterBookingVisitList({
  bookingListHref,
  bookings,
  checkInHref,
}: {
  bookingListHref: string;
  bookings: AdminDraftBooking[];
  checkInHref: string;
}) {
  const [visitBucket, setVisitBucket] = useState<VisitBucket>("upcoming");
  const [bookingDateFilter, setBookingDateFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((booking) => booking.appointmentDate === today).length;
  const checkedInCount = bookings.filter((booking) => booking.checkedIn).length;
  const bucketCounts = useMemo(() => {
    const now = new Date();
    return {
      all: bookings.length,
      needs_follow_up: bookings.filter((booking) => appointmentFollowUpDue({
        appointment_date: booking.appointmentDate,
        appointment_time: booking.appointmentTime,
        status: booking.status,
      }, now)).length,
      past: bookings.filter((booking) => isPastAppointmentByTime({
        appointment_date: booking.appointmentDate,
        appointment_time: booking.appointmentTime,
        status: booking.status,
      }, now)).length,
      upcoming: bookings.filter((booking) => !isPastAppointmentByTime({
        appointment_date: booking.appointmentDate,
        appointment_time: booking.appointmentTime,
        status: booking.status,
      }, now)).length,
    };
  }, [bookings]);
  const visibleBookings = useMemo(
    () => bookings.filter((booking) => matchesBookingFilters({
      booking,
      date: bookingDateFilter,
      search: bookingSearch,
      status: bookingStatusFilter,
      visitBucket,
    })),
    [bookingDateFilter, bookingSearch, bookingStatusFilter, bookings, visitBucket],
  );

  return (
    <Section eyebrow="Booking visits" title="Visit management">
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ["Visible bookings", String(bookings.length)],
          ["Today", String(todayCount)],
          ["Checked in", String(checkedInCount)],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-5" key={label}>
            <p className="text-sm font-semibold text-[#65584f]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#65584f]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-[#d6c8ad] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">
          Visit timing
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {VISIT_BUCKETS.map((bucket) => (
            <button
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                visitBucket === bucket.value
                  ? "bg-[#cd8188] text-white shadow-[0_10px_24px_rgba(205,129,136,0.18)]"
                  : "border border-[#d6c8ad] bg-[#fffaf5] text-[#65584f] hover:bg-[#f5f1e8]"
              }`}
              key={bucket.value}
              onClick={() => setVisitBucket(bucket.value)}
              type="button"
            >
              {bucket.label} ({bucketCounts[bucket.value]})
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-[#65584f]">
          Visits move to past 24 hours after their scheduled time. Needs follow-up highlights visits where staff should record the outcome.
        </p>
      </div>

      <div className="mt-5 grid gap-4 rounded-[24px] border border-[#d6c8ad] bg-white p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Date</span>
          <input
            className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            onChange={(event) => setBookingDateFilter(event.target.value)}
            type="date"
            value={bookingDateFilter}
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Status</span>
          <select
            className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            onChange={(event) => setBookingStatusFilter(event.target.value)}
            value={bookingStatusFilter}
          >
            <option value="all">All statuses</option>
            {BOOKING_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white" type="button">
          <Search className="h-4 w-4" />
          Filter
        </button>
        <button
          className="rounded-full border border-[#d6c8ad] bg-white px-6 py-3 text-sm font-semibold text-[#65584f]"
          onClick={() => {
            setBookingDateFilter("");
            setBookingSearch("");
            setBookingStatusFilter("all");
            setVisitBucket("upcoming");
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      <form
        className="mt-5 rounded-[24px] border border-[#d6c8ad] bg-white p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">
            Search booking code
          </span>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#65584f] outline-none focus:border-[#cd8188]"
              onChange={(event) => setBookingSearch(event.target.value)}
              placeholder="APT-FA5C9"
              value={bookingSearch}
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white" type="submit">
              <Search className="h-4 w-4" />
              Search code
            </button>
          </div>
        </label>
        <p className="mt-3 text-xs leading-5 text-[#65584f]">
          Type the visitor booking ID from their appointment card or QR screen.
        </p>
      </form>

      <div className="mt-5">
        <BookingQrScanner checkInHref={checkInHref} />
      </div>

      <div className="mt-6 space-y-4">
        {visibleBookings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#d6c8ad] bg-white p-8 text-center">
            <p className="text-xl font-semibold text-[#65584f]">No bookings match this view.</p>
            <p className="mt-2 text-sm text-[#65584f]">Try clearing filters or choosing a different date.</p>
          </div>
        ) : (
          visibleBookings.map((booking) => {
            const followUpDue = appointmentFollowUpDue({
              appointment_date: booking.appointmentDate,
              appointment_time: booking.appointmentTime,
              status: booking.status,
            });

            return (
              <section
                className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_16px_50px_rgba(101,88,79,0.08)]"
                key={booking.id}
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${bookingStatusClass(booking.status)}`}>
                        {booking.status.replace("_", " ")}
                      </span>
                      {booking.checkedIn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf6df] px-3 py-1 text-xs font-bold text-[#3f6f24]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Checked in
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f7ecda] px-3 py-1 text-xs font-bold text-[#65584f]">
                        <QrCode className="h-3.5 w-3.5" />
                        {formatBookingDisplayCode(booking)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Visit</p>
                        <p className="mt-1 text-lg font-semibold text-[#65584f]">{formatBookingDate(booking.appointmentDate)}</p>
                        <p className="text-sm text-[#65584f]">{formatBookingTime(booking.appointmentTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Adopter</p>
                        <p className="mt-1 text-lg font-semibold text-[#65584f]">{booking.adopterName}</p>
                        <p className="break-words text-sm text-[#65584f]">{booking.adopterEmail ?? "No email"}</p>
                        <p className="text-sm text-[#65584f]">{booking.adopterPhoneNumber ?? "No phone"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Dog and Shelter</p>
                        <p className="mt-1 text-lg font-semibold text-[#65584f]">{bookingDogLabel(booking)}</p>
                        <p className="text-sm text-[#65584f]">{booking.shelterName}</p>
                        <p className="text-sm text-[#65584f]">{[booking.shelterDistrict, booking.shelterProvince].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>

                    {booking.visitorNote ? (
                      <div className="mt-4 rounded-2xl bg-[#f8f0e5] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Visitor note</p>
                        <p className="mt-1 text-sm leading-6 text-[#65584f]">{booking.visitorNote}</p>
                      </div>
                    ) : null}
                  </div>

                  <form action={decideBookingAction} className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
                    <input name="appointmentId" type="hidden" value={booking.id} />
                    <input name="returnTo" type="hidden" value={bookingListHref} />
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Status</p>
                      <p className="mt-1 text-lg font-semibold text-[#65584f]">{bookingDecisionLabel(booking.status)}</p>
                      {booking.shelterNote ? (
                        <p className="mt-2 text-sm leading-6 text-[#65584f]">{booking.shelterNote}</p>
                      ) : null}
                      {booking.proposedAppointmentDate && booking.proposedAppointmentTime ? (
                        <p className="mt-2 rounded-xl bg-[#f8e8ea] px-3 py-2 text-xs font-semibold text-[#65584f]">
                          Proposed: {formatBookingDate(booking.proposedAppointmentDate)} at {formatBookingTime(booking.proposedAppointmentTime)}
                        </p>
                      ) : null}
                    </div>

                    <label className="mt-3 block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Shelter note</span>
                      <textarea
                        className="min-h-[92px] w-full resize-none rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                        defaultValue={booking.shelterNote ?? ""}
                        name="shelterNote"
                        placeholder="Optional note for denial, date change, or staff context"
                      />
                    </label>

                    <details className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3" open={booking.status === "requested"}>
                      <summary className="cursor-pointer text-sm font-semibold text-[#65584f]">
                        Edit decision
                      </summary>
                      <div className="mt-3 grid gap-2">
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fffaf3] p-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">New date</span>
                            <input
                              className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                              defaultValue={booking.proposedAppointmentDate ?? booking.appointmentDate}
                              min={new Date().toISOString().slice(0, 10)}
                              name="proposedAppointmentDate"
                              type="date"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">New time</span>
                            <select
                              className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                              defaultValue={normalizeAppointmentTime(booking.proposedAppointmentTime ?? booking.appointmentTime)}
                              name="proposedAppointmentTime"
                            >
                              {APPOINTMENT_TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="accept">
                          {booking.status === "requested" ? "Accept booking" : "Mark accepted"}
                        </button>
                        <button className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64]" name="decision" type="submit" value="deny">
                          {booking.status === "requested" ? "Deny booking" : "Mark denied"}
                        </button>
                        <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" name="decision" type="submit" value="request_change">
                          Ask to change date/time
                        </button>
                      </div>
                    </details>

                    {followUpDue ? (
                      <div className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Post-visit outcome</p>
                        <div className="mt-3 grid gap-2">
                          <button className="w-full rounded-full bg-[#65584f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#50443b]" name="decision" type="submit" value="complete">
                            Mark visit completed
                          </button>
                          <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" name="decision" type="submit" value="no_show">
                            Visitor did not show
                          </button>
                          {booking.dogId ? (
                            <button className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="adopted">
                              Mark dog adopted
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <Link
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                      href={withReturnTo(bookingWorkspaceVisitorHref({ appointmentId: booking.id, bookingListHref }), bookingListHref)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open visitor profile
                    </Link>
            <Link
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
              href={withReturnTo(bookingWorkspaceDetailHref({ appointmentId: booking.id, bookingListHref }), bookingListHref)}
            >
                      <ExternalLink className="h-4 w-4" />
                      Open booking detail
            </Link>
                  </form>
                </div>
              </section>
            );
          })
        )}
      </div>
    </Section>
  );
}

function donationStatusLabel(status: string) {
  switch (status) {
    case "viewed_qr":
      return "Payment instructions viewed";
    case "proof_submitted":
      return "Slip submitted";
    case "verified":
      return "Verified";
    case "rejected":
      return "Needs follow-up";
    default:
      return "Started";
  }
}

function donationStatusClass(status: string) {
  switch (status) {
    case "verified":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "proof_submitted":
      return "bg-[#f8e8ea] text-[#9b4e59]";
    case "rejected":
      return "bg-[#fff0ef] text-[#9a3129]";
    default:
      return "bg-[#f7ecda] text-[#7d633e]";
  }
}

function DonationLedger({
  donations,
  returnTo,
  shelters = [],
  showShelterFilter = false,
}: {
  donations: AdminDraftDonation[];
  returnTo: string;
  shelters?: AdminDraftShelter[];
  showShelterFilter?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [shelterId, setShelterId] = useState("all");
  const normalizedSearch = search.trim().toLocaleLowerCase("en");
  const visibleDonations = donations.filter((donation) => {
    const matchesSearch = !normalizedSearch || [
      donation.donorName,
      donation.donorEmail,
      donation.donorPhoneNumber,
      donation.dogName,
      donation.shelterName,
    ].filter(Boolean).some((value) => value!.toLocaleLowerCase("en").includes(normalizedSearch));
    const matchesStatus = status === "all" || donation.status === status;
    const matchesShelter = shelterId === "all" || donation.shelterId === shelterId;
    return matchesSearch && matchesStatus && matchesShelter;
  });
  const verifiedDonations = donations.filter((donation) => donation.status === "verified");
  const submittedDonations = donations.filter((donation) => donation.status === "proof_submitted");
  const recordedTotal = [...verifiedDonations, ...submittedDonations]
    .reduce((sum, donation) => sum + donation.amountThb, 0);

  return (
    <Section eyebrow="Donations" title={showShelterFilter ? "Platform donation ledger" : "Shelter donation ledger"}>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ["Recorded from slips", `฿${recordedTotal.toLocaleString()}`],
          ["Awaiting review", String(submittedDonations.length)],
          ["Verified donations", String(verifiedDonations.length)],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-5" key={label}>
            <p className="text-sm font-semibold text-[#65584f]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#65584f]">{value}</p>
          </div>
        ))}
      </div>

      <div className={`mt-5 grid gap-3 rounded-[24px] border border-[#d6c8ad] bg-white p-4 ${showShelterFilter ? "md:grid-cols-[minmax(0,1fr)_220px_220px]" : "md:grid-cols-[minmax(0,1fr)_220px]"}`}>
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7f72]" />
            <input className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] py-3 pl-11 pr-4 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" onChange={(event) => setSearch(event.target.value)} placeholder="Donor, dog, email, phone" type="search" value={search} />
          </div>
        </label>
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Status</span>
          <select className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">All statuses</option>
            <option value="initiated">Started</option>
            <option value="viewed_qr">Payment instructions viewed</option>
            <option value="proof_submitted">Slip submitted</option>
            <option value="verified">Verified</option>
            <option value="rejected">Needs follow-up</option>
          </select>
        </label>
        {showShelterFilter ? (
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Shelter</span>
            <select className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" onChange={(event) => setShelterId(event.target.value)} value={shelterId}>
              <option value="all">All shelters</option>
              {shelters.map((shelter) => <option key={shelter.id} value={shelter.id}>{shelter.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {visibleDonations.map((donation) => {
          const canReview = Boolean(donation.proofUrl) && donation.status !== "verified";
          return (
            <article className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_16px_50px_rgba(101,88,79,0.08)]" key={donation.id}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${donationStatusClass(donation.status)}`}>{donationStatusLabel(donation.status)}</span>
                    <span className="rounded-full bg-[#f5f1e8] px-3 py-1 text-xs font-semibold text-[#65584f]">{new Date(donation.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Donor</p>
                      <p className="mt-1 text-lg font-semibold text-[#65584f]">{donation.donorName}</p>
                      <p className="break-words text-sm text-[#65584f]">{donation.donorEmail ?? "No email"}</p>
                      <p className="text-sm text-[#65584f]">{donation.donorPhoneNumber ?? "No phone"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Donation</p>
                      <p className="mt-1 text-2xl font-semibold text-[#65584f]">฿{donation.amountThb.toLocaleString()}</p>
                      <p className="text-sm text-[#65584f]">
                        {`${donation.treatCount} ${donation.treatCount === 1 ? "treat" : "treats"}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">For</p>
                      <p className="mt-1 text-lg font-semibold text-[#65584f]">{donation.dogName}</p>
                      <p className="text-sm text-[#65584f]">{donation.shelterName}</p>
                      <Link className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#c97580]" href={`/dogs/${donation.dogId}`} target="_blank">Open dog profile<ExternalLink size={14} /></Link>
                    </div>
                  </div>
                </div>

                <form action={reviewDonationAction} className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
                  <input name="donationId" type="hidden" value={donation.id} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <input name="shelterId" type="hidden" value={donation.shelterId} />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Transfer evidence</p>
                  {donation.proofUrl ? (
                    <a className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" href={donation.proofUrl} rel="noreferrer" target="_blank">
                      <FileCheck2 size={16} />
                      Open transfer slip
                    </a>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-[#d6c8ad] bg-white px-4 py-4 text-sm text-[#8d7f72]">No slip uploaded yet.</div>
                  )}
                  {donation.proofOriginalFileName ? <p className="mt-2 truncate text-xs text-[#8d7f72]">{donation.proofOriginalFileName}</p> : null}
                  {donation.proofSubmittedAt ? <p className="mt-1 text-xs text-[#8d7f72]">Submitted {new Date(donation.proofSubmittedAt).toLocaleString()}</p> : null}
                  <label className="mt-3 block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter note</span>
                    <textarea className="min-h-20 w-full resize-none rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]" defaultValue={donation.shelterNote ?? ""} name="shelterNote" placeholder="Optional reconciliation note" />
                  </label>
                  {canReview ? (
                    <div className="mt-3 grid gap-2">
                      <button className="rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d]" name="decision" type="submit" value="verify">Verify donation</button>
                      <button className="rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#9a3129] hover:bg-[#fff1f0]" name="decision" type="submit" value="reject">Needs follow-up</button>
                    </div>
                  ) : null}
                </form>
              </div>
            </article>
          );
        })}
        {visibleDonations.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-8 text-center">
            <Banknote className="mx-auto h-8 w-8 text-[#cd8188]" />
            <p className="mt-3 text-lg font-semibold text-[#65584f]">No donations match this view.</p>
            <p className="mt-1 text-sm text-[#8d7f72]">New donation attempts and submitted slips will appear here.</p>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function ShelterMessagesTab({
  adminMode,
  messageThreads,
  messagesUnavailable,
  returnTo,
  shelter,
}: {
  adminMode: boolean;
  messageThreads: AdminDraftMessageThread[];
  messagesUnavailable: boolean;
  returnTo: string;
  shelter: AdminDraftShelter;
}) {
  const router = useRouter();
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const shelterThreads = messageThreads.filter((thread) => thread.shelterId === shelter.id);
  const filteredThreads = shelterThreads.filter((thread) => matchesMessageThread(thread, messageSearch, messageFilter));
  const selectedThread = filteredThreads.find((thread) => thread.appointmentId === selectedThreadId) ?? filteredThreads[0] ?? null;
  const filterOptions: { label: string; value: MessageFilter }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Upcoming visits", value: "upcoming" },
    { label: "Needs reply", value: "needs_reply" },
  ];

  useEffect(() => {
    if (messagesUnavailable) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    const interval = window.setInterval(refreshIfVisible, MESSAGE_THREAD_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [messagesUnavailable, router]);

  useEffect(() => {
    if (messagesUnavailable) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`shelter-messages:${shelter.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `shelter_id=eq.${shelter.id}`,
          schema: "public",
          table: "appointment_messages",
        },
        () => {
          if (document.visibilityState === "visible") {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [messagesUnavailable, router, shelter.id]);

  return (
    <Section eyebrow="Messaging" title="Visitor conversations">
      {adminMode ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d6c8ad] px-4 py-2 text-xs font-semibold text-[#65584f]">
          <ShieldCheck className="h-4 w-4" />
          Read-only PawJai admin view
        </div>
      ) : null}
      {messagesUnavailable ? (
        <div className="mt-4 rounded-2xl border border-[#d6c8ad] bg-[#fff8ed] p-4 text-sm leading-6 text-[#7a5a2e]">
          Messages are temporarily unavailable. Booking and dog management remain available.
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#65584f]">{shelterThreads.length} appointment threads</p>
              <p className="mt-1 text-sm text-[#65584f]">{shelter.unreadMessageCount} unread adopter messages</p>
            </div>
            <MessageCircle className="h-5 w-5 text-[#cd8188]" />
          </div>
          <label className="sr-only" htmlFor={`message-search-${shelter.id}`}>Search message threads</label>
          <input
            className="mt-4 w-full rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            id={`message-search-${shelter.id}`}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder="Search adopter, dog, booking code"
            type="search"
            value={messageSearch}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  messageFilter === option.value
                    ? "border-[#cd8188] bg-[#cd8188] text-white"
                    : "border-[#d6c8ad] bg-white text-[#65584f]"
                }`}
                key={option.value}
                onClick={() => setMessageFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {filteredThreads.map((thread) => (
              <button
                className={`rounded-2xl border p-3 text-left transition ${
                  selectedThread?.appointmentId === thread.appointmentId
                    ? "border-[#cd8188] bg-[#fff7eb]"
                    : "border-[#d6c8ad] bg-white hover:bg-[#f5f1e8]"
                }`}
                key={thread.appointmentId}
                onClick={() => setSelectedThreadId(thread.appointmentId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#65584f]">{thread.adopterName}</p>
                    <p className="mt-1 truncate text-xs text-[#65584f]">{thread.dogName} · {thread.bookingCode}</p>
                  </div>
                  {thread.unreadForShelterCount > 0 ? (
                    <span className="rounded-full bg-[#cd8188] px-2 py-0.5 text-xs font-semibold text-white">
                      {thread.unreadForShelterCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#65584f]">
                  {thread.latestMessage?.body ? (
                    <span data-i18n-ignore>{thread.latestMessage.body}</span>
                  ) : (
                    "No messages yet. Conversation opens after a booked visit."
                  )}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8b7b]">
                  {formatMessageTime(thread.latestMessage?.created_at ?? `${thread.appointmentDate}T${thread.appointmentTime}`)}
                </p>
              </button>
            ))}
            {filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-white p-4 text-sm text-[#65584f]">
                No message threads match these filters.
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-[#d6c8ad] bg-white p-4">
          {selectedThread ? (
            <div>
              <div className="flex flex-col gap-3 border-b border-[#d6c8ad] pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">{selectedThread.bookingCode}</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#65584f]">{selectedThread.dogName} with {selectedThread.adopterName}</h3>
                  <p className="mt-1 text-sm text-[#65584f]">
                    {formatBookingDate(selectedThread.appointmentDate)} at {formatBookingTime(selectedThread.appointmentTime)} · {formatStatus(selectedThread.status)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-[#fffaf5] px-4 py-2 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                    href={withReturnTo(`/booking/${selectedThread.appointmentId}`, returnTo)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Booking
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-[#fffaf5] px-4 py-2 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                    href={withReturnTo(`/booking/${selectedThread.appointmentId}/visitor-profile`, returnTo)}
                  >
                    <Users className="h-4 w-4" />
                    Visitor profile
                  </Link>
                </div>
              </div>
              <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {selectedThread.messages.length > 0 ? selectedThread.messages.map((message) => {
                  const isShelter = message.sender_role === "shelter";
                  const previewImage = !adminMode && isPreviewableMessageImage(message.attachment_type);
                  const previewVideo = !adminMode && isPreviewableMessageVideo(message.attachment_type);

                  return (
                    <div className={`flex ${isShelter ? "justify-end" : "justify-start"}`} key={message.id}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isShelter ? "bg-[#65584f] text-white" : "bg-[#f8f0e5] text-[#65584f]"
                      }`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isShelter ? "text-white/70" : "text-[#65584f]"}`}>
                          {message.sender_role === "system" ? "PawJai/system" : message.sender_label ?? (isShelter ? shelter.name : selectedThread.adopterName)}
                        </p>
                        {message.attachment_url && previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={message.attachment_name ?? "Appointment attachment"}
                            className="mt-2 max-h-[260px] w-full rounded-xl object-cover"
                            src={message.attachment_url}
                          />
                        ) : null}
                        {message.attachment_url && previewVideo ? (
                          <video
                            className="mt-2 max-h-[280px] w-full rounded-xl bg-black"
                            controls
                            preload="metadata"
                          >
                            <source src={message.attachment_url} type={message.attachment_type ?? undefined} />
                            <a href={message.attachment_url} rel="noreferrer" target="_blank">View attachment</a>
                          </video>
                        ) : null}
                        <p className="mt-1 whitespace-pre-wrap" data-i18n-ignore>{message.body}</p>
                        {message.attachment_url && (adminMode || (!previewImage && !previewVideo)) ? (
                          <a
                            className={`mt-2 inline-flex text-xs font-semibold underline ${isShelter ? "text-white" : "text-[#65584f]"}`}
                            href={message.attachment_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {message.attachment_name ?? "View attachment"}
                          </a>
                        ) : null}
                        <p className={`mt-2 text-[11px] ${isShelter ? "text-white/60" : "text-[#65584f]/70"}`}>
                          {formatMessageTime(message.created_at)}
                          {adminMode ? (
                            <>
                              <br />
                              <time dateTime={message.created_at} title={`Backend timestamp: ${formatBackendMessageTimestampTitle(message.created_at)}`}>
                                Backend timestamp: {formatBackendMessageTimestamp(message.created_at)}
                              </time>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-5 text-sm text-[#65584f]">
                    No conversation selected yet. The first adopter or shelter message will appear here.
                  </div>
                )}
              </div>
              {adminMode ? (
                <div className="mt-4 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4 text-sm text-[#65584f]">
                  Read-only PawJai admin view. Admin can review this conversation but cannot reply, edit, or mark shelter messages read.
                </div>
              ) : (
                <form action={sendShelterAppointmentMessageAction} className="mt-4 grid gap-2" encType="multipart/form-data">
                  <input name="appointmentId" type="hidden" value={selectedThread.appointmentId} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <label className="sr-only" htmlFor={`message-body-${selectedThread.appointmentId}`}>Write a shelter reply</label>
                  <div className="flex gap-2">
                    <textarea
                      className="min-h-12 flex-1 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                      disabled={messagesUnavailable}
                      id={`message-body-${selectedThread.appointmentId}`}
                      name="body"
                      placeholder={messagesUnavailable ? "Messaging temporarily unavailable" : "Write a shelter reply..."}
                    />
                    <button
                      className="h-12 rounded-full bg-[#cd8188] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d6c8ad]"
                      disabled={messagesUnavailable}
                      type="submit"
                    >
                      Send
                    </button>
                  </div>
                  <label
                    className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#d6c8ad] bg-[#fffaf5] px-4 py-2 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                    htmlFor={`shelter-attachment-${selectedThread.appointmentId}`}
                  >
                    <FileText className="h-4 w-4" />
                    Attach file
                  </label>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,application/pdf,image/heic,image/heif,image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    className="sr-only"
                    disabled={messagesUnavailable}
                    id={`shelter-attachment-${selectedThread.appointmentId}`}
                    name="attachment"
                    type="file"
                  />
                </form>
              )}
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-center text-sm text-[#65584f]">
              No conversation selected. Appointment conversations will appear here after visitors book shelter visits.
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function ShelterWorkspace({
  adminMode,
  bookingListHref,
  bookings,
  calendarReturnTo,
  checkInHref,
  createDogHref,
  dogEditHref,
  dogs,
  donationReturnTo,
  donations,
  initialBookingView,
  messageThreads,
  messagesUnavailable,
  profileReturnTo,
  shelter,
  tab,
  setTab,
  workspaceBaseHref,
}: {
  adminMode: boolean;
  bookingListHref: string;
  bookings: AdminDraftBooking[];
  calendarReturnTo: string;
  checkInHref: string;
  createDogHref: string;
  dogEditHref: (dog: AdminDraftDog) => string;
  dogs: AdminDraftDog[];
  donationReturnTo: string;
  donations: AdminDraftDonation[];
  initialBookingView?: BookingWorkspaceView;
  messageThreads: AdminDraftMessageThread[];
  messagesUnavailable: boolean;
  profileReturnTo: string;
  shelter: AdminDraftShelter;
  tab: ShelterTab;
  setTab: (tab: ShelterTab) => void;
  workspaceBaseHref?: string;
}) {
  return (
    <div className="space-y-6">
      <Section eyebrow={adminMode ? "Partner shelter workspace" : "My Shelter Workspace powered by PAWJAI"} title={shelter.name}>
        <div className={`mt-5 grid gap-3 ${adminMode ? "md:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"}`}>
          <ShelterWorkspaceTabButton
            active={tab === "profile"}
            adminMode={adminMode}
            href={workspaceBaseHref ? `${workspaceBaseHref}?view=profile` : undefined}
            icon={<Building2 className="h-5 w-5" />}
            meta="Identity"
            onClick={() => setTab("profile")}
          >
            Shelter profile
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceTabButton
            active={tab === "dogs"}
            adminMode={adminMode}
            href={workspaceBaseHref ? `${workspaceBaseHref}?view=dogs` : undefined}
            icon={<PawPrint className="h-5 w-5" />}
            meta={`${dogs.length} dogs`}
            onClick={() => setTab("dogs")}
          >
            Dog listings
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceLinkTab
            adminMode={adminMode}
            href={createDogHref}
            icon={<PlusCircle className="h-5 w-5" />}
            meta="New listing"
          >
            Create dog profile
          </ShelterWorkspaceLinkTab>
          <ShelterWorkspaceTabButton
            active={tab === "bookings"}
            adminMode={adminMode}
            href={workspaceBaseHref ? `${workspaceBaseHref}?view=bookings` : undefined}
            icon={<CalendarDays className="h-5 w-5" />}
            meta={`${bookings.length} visits`}
            onClick={() => setTab("bookings")}
          >
            Booking visits
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceTabButton
            active={tab === "donations"}
            adminMode={adminMode}
            href={workspaceBaseHref ? `${workspaceBaseHref}?view=donations` : undefined}
            icon={<Banknote className="h-5 w-5" />}
            meta={`${donations.length} records`}
            onClick={() => setTab("donations")}
          >
            Donations
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceTabButton
            active={tab === "messages"}
            adminMode={adminMode}
            href={workspaceBaseHref ? `${workspaceBaseHref}?view=messages` : undefined}
            icon={<MessageCircle className="h-5 w-5" />}
            meta={`${shelter.unreadMessageCount} messages`}
            onClick={() => setTab("messages")}
          >
            Messaging
          </ShelterWorkspaceTabButton>
        </div>
      </Section>
      {tab === "profile" ? <ShelterProfileTab returnTo={profileReturnTo} shelter={shelter} /> : null}
      {tab === "dogs" ? <ShelterDogsTab dogEditHref={dogEditHref} dogs={dogs} shelter={shelter} /> : null}
      {tab === "bookings" ? (
        <ShelterBookingsTab
          bookingListHref={bookingListHref}
          bookings={bookings}
          calendarReturnTo={calendarReturnTo}
          checkInHref={checkInHref}
          initialView={initialBookingView}
          shelter={shelter}
        />
      ) : null}
      {tab === "donations" ? (
        <div className="space-y-6">
          <ShelterDonationSettings returnTo={donationReturnTo} shelter={shelter} />
          <DonationLedger donations={donations} returnTo={donationReturnTo} />
        </div>
      ) : null}
      {tab === "messages" ? (
        <ShelterMessagesTab
          adminMode={adminMode}
          messageThreads={messageThreads}
          messagesUnavailable={messagesUnavailable}
          returnTo={adminMode ? `/admindraft?shelter=${shelter.id}&view=messages` : profileReturnTo.replace("view=profile", "view=messages")}
          shelter={shelter}
        />
      ) : null}
    </div>
  );
}

function PartnerSheltersTab({
  bookings,
  dogs,
  donations,
  initialBookingView,
  selectedShelter,
  selectedShelterId,
  setSelectedShelterId,
  shelterTab,
  shelters,
  setShelterTab,
  messageThreads,
  messagesUnavailable,
}: {
  bookings: AdminDraftBooking[];
  dogs: AdminDraftDog[];
  donations: AdminDraftDonation[];
  initialBookingView?: BookingWorkspaceView;
  messageThreads: AdminDraftMessageThread[];
  messagesUnavailable: boolean;
  selectedShelter: AdminDraftShelter;
  selectedShelterId: string;
  setSelectedShelterId: (id: string) => void;
  shelterTab: ShelterTab;
  shelters: AdminDraftShelter[];
  setShelterTab: (tab: ShelterTab) => void;
}) {
  return (
    <div className="space-y-6">
      <Section eyebrow="Partner shelters" title="Shelter umbrella">
        <p className="mt-2 text-sm leading-6 text-[#65584f]">
          PawJai HQ lands here first. Open a shelter to see its profile, dog listings, booking visits, donations, and messaging.
        </p>
        <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-2">
          {shelters.map((shelter) => (
            <button
              className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition ${
                shelter.id === selectedShelterId ? "border-[#cd8188] bg-[#cd8188] text-white" : "border-[#d6c8ad] bg-white text-[#65584f] hover:bg-[#f5f1e8]"
              }`}
              key={shelter.id}
              onClick={() => setSelectedShelterId(shelter.id)}
              type="button"
            >
              <p className="font-semibold">{shelter.name}</p>
              <p className={`mt-1 text-sm ${shelter.id === selectedShelterId ? "text-white/75" : "text-[#65584f]"}`}>{shelter.location}</p>
              <div className={`mt-3 flex gap-2 text-xs font-semibold ${shelter.id === selectedShelterId ? "text-white/80" : "text-[#65584f]"}`}>
                <span>{shelter.dogsCount} dogs</span>
                <span>{shelter.pendingBookingsCount} pending visits</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Selected shelter</p>
            <p className="mt-2 font-semibold text-[#65584f]">{selectedShelter.name}</p>
            <p className="mt-1 text-sm text-[#65584f]">{selectedShelter.location}</p>
          </div>
          <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Listings</p>
            <p className="mt-2 text-2xl font-semibold text-[#65584f]">{selectedShelter.dogsCount}</p>
            <p className="mt-1 text-sm text-[#65584f]">dogs under this shelter</p>
          </div>
          <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Bookings</p>
            <p className="mt-2 text-2xl font-semibold text-[#65584f]">{selectedShelter.pendingBookingsCount}</p>
            <p className="mt-1 text-sm text-[#65584f]">pending visits</p>
          </div>
        </div>
      </Section>
      <ShelterWorkspace
        adminMode
        bookingListHref={`/admindraft?shelter=${selectedShelter.id}&view=bookings`}
        bookings={bookings}
        calendarReturnTo={`/admindraft?shelter=${selectedShelter.id}&view=bookings&bookingView=calendar`}
        checkInHref={withReturnTo("/booking/check-in", `/admindraft?shelter=${selectedShelter.id}&view=bookings`)}
        createDogHref={`/admindraft/dog-creation?shelter=${selectedShelter.id}`}
        dogEditHref={(dog) => `/admindraft/dogs/${dog.id}/edit`}
        dogs={dogs}
        donationReturnTo={`/admindraft?shelter=${selectedShelter.id}&view=donations`}
        donations={donations}
        initialBookingView={initialBookingView}
        messageThreads={messageThreads}
        messagesUnavailable={messagesUnavailable}
        profileReturnTo={`/admindraft?shelter=${selectedShelter.id}&view=profile`}
        shelter={selectedShelter}
        tab={shelterTab}
        setTab={setShelterTab}
      />
    </div>
  );
}

function AllDogsTab({ dogs, shelters }: { dogs: AdminDraftDog[]; shelters: AdminDraftShelter[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [shelterId, setShelterId] = useState("all");
  const filteredDogs = dogs.filter((dog) => {
    return matchesDogFilters(dog, search, status) && (shelterId === "all" || dog.shelterId === shelterId);
  });

  return (
    <Section eyebrow="All dog listings" title="Platform dog database">
      <p className="mt-2 text-sm leading-6 text-[#65584f]">
        This is the global dog listing view that does not require entering a shelter first.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto_auto]">
        <label className="sr-only" htmlFor="all-dog-search">Search dogs</label>
        <input
          className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
          id="all-dog-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dog, breed, shelter, size"
          type="search"
          value={search}
        />
        <label className="sr-only" htmlFor="all-dog-shelter">Filter dogs by shelter</label>
        <select
          className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
          id="all-dog-shelter"
          onChange={(event) => setShelterId(event.target.value)}
          value={shelterId}
        >
          {shelterFilterOptions(shelters).map((shelter) => (
            <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="all-dog-status">Filter dogs by status</label>
        <select
          className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
          id="all-dog-status"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="draft">Draft</option>
          <option value="reserved">Reserved</option>
          <option value="adopted">Adopted</option>
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white" type="button">
          <Search className="h-4 w-4" />
          {filteredDogs.length} dogs
        </button>
        <button
          className="rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f]"
          onClick={() => {
            setSearch("");
            setStatus("all");
            setShelterId("all");
          }}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredDogs.map((dog) => (
          <DogCard dog={dog} editHref={`/admindraft/dogs/${dog.id}/edit`} key={dog.id} />
        ))}
        {filteredDogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-sm text-[#65584f]">
            No dog listings match these filters.
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function GlobalBookingsTab({ bookings, shelters }: { bookings: AdminDraftBooking[]; shelters: AdminDraftShelter[] }) {
  const [shelterId, setShelterId] = useState("all");
  const filteredBookings = bookings.filter((booking) => shelterId === "all" || booking.shelterId === shelterId);
  const bookingListHref = shelterId === "all" ? "/admindraft?view=bookings" : `/admindraft?shelter=${shelterId}&view=bookings`;

  return (
    <Section eyebrow="Bookings" title="All shelter visits">
      <p className="mt-2 text-sm leading-6 text-[#65584f]">
        PawJai HQ can still see bookings across shelters here. Shelter users only see the booking tab inside their own workspace.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-[260px_auto]">
        <label className="sr-only" htmlFor="booking-shelter-filter">Filter bookings by shelter</label>
        <select
          className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
          id="booking-shelter-filter"
          onChange={(event) => setShelterId(event.target.value)}
          value={shelterId}
        >
          {shelterFilterOptions(shelters).map((shelter) => (
            <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
          ))}
        </select>
        <button
          className="rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f]"
          onClick={() => setShelterId("all")}
          type="button"
        >
          Show all shelters
        </button>
      </div>
      <ShelterBookingVisitList
        bookingListHref={bookingListHref}
        bookings={filteredBookings}
        checkInHref={withReturnTo("/booking/check-in", bookingListHref)}
      />
    </Section>
  );
}

function AdsTab({
  adClicks,
  ads,
  creativeSettings,
}: {
  adClicks: AdminDraftAdClick[];
  ads: AdminDraftAd[];
  creativeSettings: AdminDraftData["adCreativeSettings"];
}) {
  const router = useRouter();
  const [view, setView] = useState<AdWorkspaceView>("review");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdStatusFilter>("all");
  const [previewAd, setPreviewAd] = useState<AdminDraftAd | null>(null);
  const [selectedAnalyticsAdId, setSelectedAnalyticsAdId] = useState("");
  const [adMutationPendingId, setAdMutationPendingId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const filteredAds = ads.filter((ad) => matchesAdFilters(ad, search, status, today));
  const searchMatchedAds = ads.filter((ad) => matchesAdFilters(ad, search, "all", today));
  const analyticsAds = searchMatchedAds;
  const visibleAdCount = view === "review" ? filteredAds.length : analyticsAds.length;
  const adStatusCounts = AD_STATUS_TABS.reduce<Record<AdStatusFilter, number>>((counts, tab) => {
    counts[tab.value] = tab.value === "all"
      ? searchMatchedAds.length
      : searchMatchedAds.filter((ad) => matchesAdFilters(ad, "", tab.value, today)).length;
    return counts;
  }, {
    all: 0,
    approved: 0,
    denied: 0,
    expired: 0,
    paused: 0,
    pending: 0,
  });
  const selectedAnalyticsAd = analyticsAds.find((ad) => ad.id === selectedAnalyticsAdId) ?? analyticsAds[0] ?? ads[0] ?? null;
  const selectedAdClicks = selectedAnalyticsAd ? adClicks.filter((click) => click.adId === selectedAnalyticsAd.id) : [];
  const totalClicks = selectedAdClicks.length;
  const knownClickerIds = new Set(selectedAdClicks.map((click) => click.userId).filter(Boolean));
  const clickBuckets = buildAdClickBuckets(selectedAdClicks, today);
  const maxBucketCount = Math.max(1, ...clickBuckets.map((bucket) => bucket.count));

  async function runAdMutation(adId: string, mutation: () => Promise<unknown>) {
    setAdMutationPendingId(adId);
    try {
      await mutation();
      router.refresh();
    } finally {
      setAdMutationPendingId(null);
    }
  }

  return (
    <>
      <Section eyebrow="Ads" title="PawJai-managed ads">
        <p className="mt-2 text-sm leading-6 text-[#65584f]">
          Partner submissions from /ads land in the same ads table. PawJai reviews, pauses, and date-edits records internally. Connected ads: {ads.length}.
        </p>
        <form
          action={updateAdCreativeSettingsFromFormAction.bind(null, ADS_DRAFT_RETURN_TO)}
          className="mt-5 rounded-[24px] border border-[#d6c8ad] bg-[#fffaf5] p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#cd8188]">Creative specs shown on /ads</p>
              <p className="mt-1 text-sm leading-6 text-[#65584f]">
                Change the recommended ad card dimensions and media limits without redeploying code.
              </p>
            </div>
            <button className="rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" type="submit">
              Save specs
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">Width px</span>
              <input
                className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                defaultValue={creativeSettings.width}
                max={900}
                min={240}
                name="width"
                required
                type="number"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">Height px</span>
              <input
                className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                defaultValue={creativeSettings.height}
                max={1200}
                min={320}
                name="height"
                required
                type="number"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">Video seconds</span>
              <input
                className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                defaultValue={creativeSettings.maxVideoSeconds}
                max={30}
                min={5}
                name="max_video_seconds"
                required
                type="number"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">Upload MB</span>
              <input
                className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                defaultValue={creativeSettings.maxUploadMb}
                max={200}
                min={10}
                name="max_upload_mb"
                required
                type="number"
              />
            </label>
          </div>
        </form>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-5 py-3 text-sm font-semibold ${
              view === "review"
                ? "bg-[#cd8188] text-white"
                : "border border-[#d6c8ad] bg-white text-[#65584f]"
            }`}
            onClick={() => setView("review")}
            type="button"
          >
            Review ads
          </button>
          <button
            className={`rounded-full px-5 py-3 text-sm font-semibold ${
              view === "analytics"
                ? "bg-[#cd8188] text-white"
                : "border border-[#d6c8ad] bg-white text-[#65584f]"
            }`}
            onClick={() => setView("analytics")}
            type="button"
          >
            Analytics
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="sr-only" htmlFor="admin-ad-search">Search ads</label>
          <input
            className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
            id="admin-ad-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ad code, advertiser, or URL"
            type="search"
            value={search}
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-5 py-3 text-sm font-semibold text-white" type="button">
            <Search className="h-4 w-4" />
            {visibleAdCount} ads
          </button>
          <button
            className="rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f]"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
            type="button"
          >
            Reset
          </button>
        </div>
        {view === "review" ? (
          <div className="mt-4 flex flex-wrap gap-2 rounded-[22px] border border-[#eadfce] bg-[#fffaf5] p-2">
            {AD_STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#cd8188] text-white shadow-[0_10px_22px_rgba(205,129,136,0.20)]"
                      : "bg-white text-[#65584f] hover:bg-[#f5f1e8]"
                  }`}
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active ? "bg-white/20 text-white" : "bg-[#f7ecda] text-[#65584f]"
                  }`}>
                    {adStatusCounts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {view === "analytics" ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-[28px] border border-[#d6c8ad] bg-[#fffaf5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Ads</p>
              <div className="mt-4 grid gap-2">
                {analyticsAds.map((ad) => {
                  const adClickCount = adClicks.filter((click) => click.adId === ad.id).length;
                  const active = selectedAnalyticsAd?.id === ad.id;

                  return (
                    <button
                      className={`rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-[#cd8188] bg-white"
                          : "border-[#d6c8ad] bg-white/70 hover:bg-white"
                      }`}
                      key={ad.id}
                      onClick={() => setSelectedAnalyticsAdId(ad.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#65584f]">{ad.companyName}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#cd8188]">{ad.submissionCode}</p>
                        </div>
                        <span className="rounded-full bg-[#f7ecda] px-2.5 py-1 text-xs font-bold text-[#65584f]">{adClickCount}</span>
                      </div>
                    </button>
                  );
                })}
                {analyticsAds.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-white p-4 text-sm text-[#65584f]">
                    No ads match these filters.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
              {selectedAnalyticsAd ? (
                <div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">{selectedAnalyticsAd.submissionCode}</p>
                      <h3 className="mt-1 text-2xl font-semibold text-[#65584f]">{selectedAnalyticsAd.companyName}</h3>
                      <p className="mt-2 break-all text-sm font-semibold text-[#cd8188]">{selectedAnalyticsAd.clickUrl}</p>
                    </div>
                    <button
                      className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                      onClick={() => setPreviewAd(selectedAnalyticsAd)}
                      type="button"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Preview full ad
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-[#fffaf5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]">Clicks</p>
                      <p className="mt-2 text-3xl font-semibold text-[#65584f]">{totalClicks}</p>
                    </div>
                    <div className="rounded-2xl bg-[#fffaf5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]">Logged-in users</p>
                      <p className="mt-2 text-3xl font-semibold text-[#65584f]">{knownClickerIds.size}</p>
                    </div>
                    <div className="rounded-2xl bg-[#fffaf5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]">Anonymous clicks</p>
                      <p className="mt-2 text-3xl font-semibold text-[#65584f]">{selectedAdClicks.filter((click) => !click.userId).length}</p>
                    </div>
                    <div className="rounded-2xl bg-[#fffaf5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65584f]">Live days</p>
                      <p className="mt-2 text-3xl font-semibold text-[#65584f]">{getAdLiveDays(selectedAnalyticsAd, today)}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#65584f]">Clicks over last 14 days</p>
                      <p className="text-xs text-[#65584f]">{totalClicks} total</p>
                    </div>
                    <div className="mt-4 flex h-44 items-end gap-2">
                      {clickBuckets.map((bucket) => (
                        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={bucket.key}>
                          <div className="flex h-32 w-full items-end rounded-full bg-[#f4eadb]">
                            <div
                              className="w-full rounded-full bg-[#cd8188]"
                              style={{ height: `${Math.max(bucket.count ? 10 : 0, (bucket.count / maxBucketCount) * 100)}%` }}
                              title={`${bucket.label}: ${bucket.count} clicks`}
                            />
                          </div>
                          <span className="max-w-full truncate text-[10px] text-[#65584f]">{bucket.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
                    <p className="text-sm font-semibold text-[#65584f]">Recent clickers</p>
                    <div className="mt-3 grid gap-2">
                      {selectedAdClicks.slice(0, 8).map((click) => {
                        const age = getAgeFromDateOfBirth(click.userDateOfBirth);
                        return (
                          <div className="grid gap-2 rounded-2xl bg-white p-3 text-sm md:grid-cols-[minmax(0,1fr)_150px]" key={click.id}>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#65584f]">{click.userName ?? (click.userId ? "Logged-in user" : "Anonymous visitor")}</p>
                              <p className="mt-1 truncate text-[#65584f]">
                                {[click.userEmail, click.userPhone, age !== null ? `${age} years old` : null].filter(Boolean).join(" · ") || "No profile details"}
                              </p>
                            </div>
                            <p className="text-[#65584f] md:text-right">{formatClickDate(click.clickedAt)}</p>
                          </div>
                        );
                      })}
                      {selectedAdClicks.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-white p-4 text-sm text-[#65584f]">
                          No clicks tracked for this ad yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-sm text-[#65584f]">
                  No ad selected.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {view === "review" ? (
        <div className="mt-6 grid gap-4">
          {filteredAds.map((ad) => {
            const adStatus = getAdDisplayStatus({
              endDate: ad.endDate,
              isActive: ad.isActive,
              reviewStatus: ad.reviewStatus,
              today,
            });
            const label = adDisplayStatusLabel(adStatus);
            const contact = [ad.contactEmail, ad.contactPhone, !ad.contactEmail && !ad.contactPhone ? ad.contactInfo : null]
              .filter(Boolean)
              .join(" ");

            return (
              <article className="rounded-[28px] border border-[#d6c8ad] bg-white p-5 shadow-[0_16px_50px_rgba(101,88,79,0.08)]" key={ad.id}>
                <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_340px]">
                  <div className="flex justify-center lg:justify-start">
                    <AdCard
                      ad={{
                        clickUrl: ad.clickUrl,
                        companyName: ad.companyName,
                        id: ad.id,
                        imageUrl: ad.imageUrl,
                        mediaType: ad.mediaType,
                      }}
                      cardHeight={360}
                      cardWidth={240}
                      trackClicks={false}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${adStatusClass(adStatus)}`}>
                        {label}
                      </span>
                      <span className="rounded-full bg-[#f7ecda] px-3 py-1 text-xs font-bold text-[#65584f]">
                        {ad.reviewStatus === "pending" ? "Awaiting decision" : formatStatus(ad.reviewStatus)}
                      </span>
                      <span className="rounded-full border border-[#d6c8ad] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#cd8188]">
                        {ad.submissionCode}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-[#65584f]">{ad.companyName}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Creative type</p>
                        <p className="mt-1 text-sm text-[#65584f]">{ad.mediaType === "video" ? "Video" : "Image"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Campaign dates</p>
                        <p className="mt-1 text-sm text-[#65584f]">
                          {ad.startDate} to {ad.endDate === OPEN_ENDED_AD_END_DATE ? "ongoing" : ad.endDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Contact</p>
                        <p className="mt-1 break-words text-sm text-[#65584f]">{contact || "No contact provided"}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-[#f8f0e5] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Destination URL</p>
                      <a className="mt-1 block break-all text-sm font-semibold text-[#cd8188] hover:underline" href={ad.clickUrl} rel="noopener noreferrer" target="_blank">
                        {ad.clickUrl}
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Status</p>
                      <p className="mt-1 text-lg font-semibold text-[#65584f]">
                        {ad.reviewStatus === "pending" ? "Awaiting decision" : label}
                      </p>
                    </div>

                    <details className="mt-3 rounded-2xl border border-[#d6c8ad] bg-white p-3" open={ad.reviewStatus === "pending"}>
                      <summary className="cursor-pointer text-sm font-semibold text-[#65584f]">
                        Edit ad dates
                      </summary>
                      <form action={updateAdDatesFromFormAction.bind(null, ad.id, ADS_DRAFT_RETURN_TO)} className="mt-3 grid gap-2">
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fffaf3] p-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">Start date</span>
                            <input
                              className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                              defaultValue={ad.startDate}
                              name="start_date"
                              required
                              type="date"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65584f]">End date</span>
                            <input
                              className="h-11 w-full rounded-xl border border-[#d6c8ad] bg-white px-3 text-sm text-[#65584f] outline-none focus:border-[#cd8188]"
                              defaultValue={ad.endDate}
                              name="end_date"
                              required
                              type="date"
                            />
                          </label>
                        </div>
                        <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]" type="submit">
                          Save ad dates
                        </button>
                      </form>
                    </details>

                    <div className="mt-3 grid gap-2">
                      {ad.reviewStatus !== "approved" ? (
                        <button
                          className="w-full rounded-full bg-[#3f7b35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#356b2d] disabled:opacity-60"
                          disabled={adMutationPendingId === ad.id}
                          onClick={() => runAdMutation(ad.id, () => updateAdReviewStatusAction(ad.id, "approved", ADS_DRAFT_RETURN_TO))}
                          type="button"
                        >
                          {adMutationPendingId === ad.id ? "Accepting..." : "Accept ad"}
                        </button>
                      ) : null}
                      {ad.reviewStatus !== "denied" ? (
                        <button
                          className="w-full rounded-full bg-[#c46f75] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ae5e64] disabled:opacity-60"
                          disabled={adMutationPendingId === ad.id}
                          onClick={() => runAdMutation(ad.id, () => updateAdReviewStatusAction(ad.id, "denied", ADS_DRAFT_RETURN_TO))}
                          type="button"
                        >
                          {adMutationPendingId === ad.id ? "Denying..." : "Deny ad"}
                        </button>
                      ) : null}
                      {ad.reviewStatus === "approved" ? (
                        <button
                          className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8] disabled:opacity-60"
                          disabled={adMutationPendingId === ad.id}
                          onClick={() => runAdMutation(ad.id, () => toggleAdAction(ad.id, !ad.isActive, ADS_DRAFT_RETURN_TO))}
                          type="button"
                        >
                          {adMutationPendingId === ad.id ? "Saving..." : ad.isActive ? "Pause ad" : "Resume ad"}
                        </button>
                      ) : null}
                    </div>

                    <button
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                      onClick={() => setPreviewAd(ad)}
                      type="button"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Preview full ad
                    </button>
                    <a
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                      href={ad.clickUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open destination
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
          {ads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-sm text-[#65584f]">
              No ad records are connected yet.
            </div>
          ) : null}
          {ads.length > 0 && filteredAds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-[#fffaf5] p-6 text-sm text-[#65584f]">
              No ads match these filters.
            </div>
          ) : null}
        </div>
        ) : null}
      </Section>

      {previewAd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8" role="dialog" aria-modal="true">
          <div className="max-h-full overflow-y-auto rounded-[28px] bg-[#f5f1e8] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cd8188]">Full feed preview</p>
                <h2 className="text-xl font-semibold text-[#65584f]">{previewAd.companyName}</h2>
              </div>
              <button className="rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-sm font-semibold text-[#65584f]" onClick={() => setPreviewAd(null)} type="button">
                Close
              </button>
            </div>
            <AdCard
              ad={{
                clickUrl: previewAd.clickUrl,
                companyName: previewAd.companyName,
                id: previewAd.id,
                imageUrl: previewAd.imageUrl,
                mediaType: previewAd.mediaType,
              }}
              cardHeight="min(620px, calc(100dvh - 180px))"
              cardWidth="min(370px, calc(100vw - 48px))"
              trackClicks={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function AboutTab({ about }: { about: AdminDraftAboutContent | null }) {
  return (
    <Section eyebrow="About content" title="PawJai profile content">
      <p className="mt-2 text-sm leading-6 text-[#65584f]">
        This stays PawJai-only and manages the public About page content.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Mission title</p>
          <h3 className="mt-2 text-xl font-semibold text-[#65584f]">{about?.missionTitle ?? "No mission title saved yet"}</h3>
          <p className="mt-3 text-sm leading-6 text-[#65584f]">{about?.missionBody ?? "No mission body saved yet."}</p>
        </div>
        <div className="rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Hero slogan</p>
          <p className="mt-2 text-lg font-semibold text-[#65584f]">{about?.heroSlogan ?? "No hero slogan saved yet"}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#65584f]">Partner shelters in About content</p>
          <p className="mt-2 text-3xl font-semibold text-[#65584f]">{about?.partnerSheltersCount ?? 0}</p>
        </div>
      </div>
      <FieldGrid fields={["Mission title", "Mission body", "Partner shelters", "Hero copy", "Impact numbers", "Save About content"]} />
      <Link
        className="mt-5 inline-flex rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white"
        href="/admindraft/aboutcontent"
      >
        Edit live About content
      </Link>
    </Section>
  );
}

function isShelterTab(value: string | undefined): value is ShelterTab {
  return value === "profile" || value === "dogs" || value === "bookings" || value === "donations" || value === "messages";
}

function isBookingWorkspaceView(value: string | undefined): value is BookingWorkspaceView {
  return value === "visits" || value === "calendar";
}

export default function AdminReorgDraftPanel({
  accountSettingsHref,
  data,
  initialMainTab,
  initialBookingWorkspaceView,
  initialMessage,
  initialRoleView = "pawjai",
  initialShelterId,
  initialShelterTab,
  lockRoleView = false,
  workspaceBaseHref = DRAFT_RETURN_TO,
}: {
  accountSettingsHref?: string;
  data?: AdminDraftData;
  initialBookingWorkspaceView?: string;
  initialMainTab?: string;
  initialMessage?: string;
  initialRoleView?: RoleView;
  initialShelterId?: string;
  initialShelterTab?: string;
  lockRoleView?: boolean;
  workspaceBaseHref?: string;
}) {
  const shelters = data?.shelters.length ? data.shelters : fallbackShelters;
  const dogs = data?.dogs.length ? data.dogs : fallbackDogs;
  const bookings = data?.bookings.length ? data.bookings : fallbackBookings;
  const donations = data?.donations ?? [];
  const messageThreads = data?.messageThreads ?? [];
  const messagesUnavailable = data?.messagesUnavailable ?? false;
  const adClicks = data?.adClicks ?? [];
  const ads = data?.ads ?? [];
  const about = data?.about ?? null;
  const adCreativeSettings = data?.adCreativeSettings ?? {
    height: 560,
    maxUploadMb: 100,
    maxVideoSeconds: 30,
    width: 370,
  };
  const [role, setRole] = useState<RoleView>(initialRoleView);
  const [mainTab, setMainTab] = useState<MainTab>(isMainTab(initialMainTab) ? initialMainTab : "shelters");
  const [selectedShelterId, setSelectedShelterId] = useState(
    initialShelterId && shelters.some((shelter) => shelter.id === initialShelterId)
      ? initialShelterId
      : shelters[0]?.id ?? "",
  );
  const [shelterTab, setShelterTab] = useState<ShelterTab>(isShelterTab(initialShelterTab) ? initialShelterTab : "profile");

  useEffect(() => {
    if (isShelterTab(initialShelterTab)) {
      setShelterTab(initialShelterTab);
    }
  }, [initialShelterTab]);

  const isPawjai = role === "pawjai";
  const selectedShelter = shelters.find((shelter) => shelter.id === selectedShelterId) ?? shelters[0] ?? fallbackShelters[0];
  const selectedShelterDogs = dogs.filter((dog) => dog.shelterId === selectedShelter.id);
  const selectedShelterBookings = bookings.filter((booking) => booking.shelterId === selectedShelter.id);
  const selectedShelterDonations = donations.filter((donation) => donation.shelterId === selectedShelter.id);
  const connected = data?.source === "supabase";
  const isShelterPortal = workspaceBaseHref.startsWith("/shelter/");
  const draftShelterRole = !isShelterPortal && role === "shelter" ? "shelter" : undefined;
  const shelterWorkspaceBookingsHref = isShelterPortal
    ? `${workspaceBaseHref}?view=bookings`
    : adminDraftShelterWorkspaceHref(selectedShelter.id, "bookings", draftShelterRole);
  const shelterWorkspaceCalendarReturnTo = isShelterPortal
    ? `${workspaceBaseHref}?view=bookings&bookingView=calendar`
    : `${adminDraftShelterWorkspaceHref(selectedShelter.id, "bookings", draftShelterRole)}&bookingView=calendar`;
  const shelterWorkspaceDonationReturnTo = isShelterPortal
    ? `${workspaceBaseHref}?view=donations`
    : adminDraftShelterWorkspaceHref(selectedShelter.id, "donations", draftShelterRole);
  const bookingWorkspaceView = isBookingWorkspaceView(initialBookingWorkspaceView)
    ? initialBookingWorkspaceView
    : "visits";
  const shelterWorkspaceCreateDogHref = isShelterPortal
    ? `${workspaceBaseHref}/dogs/new`
    : adminDraftShelterCreateDogHref(selectedShelter.id, draftShelterRole);
  const shelterWorkspaceDogEditHref = (dog: AdminDraftDog) => isShelterPortal
    ? `${workspaceBaseHref}/dogs/${dog.id}/edit`
    : adminDraftDogEditHref(dog.id, draftShelterRole);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
      <div className="pointer-events-none absolute -right-10 top-16 hidden rotate-12 text-[#d6c8ad]/35 lg:block" aria-hidden="true">
        <Bone className="h-36 w-36" strokeWidth={1.3} />
      </div>
      <div className="pointer-events-none absolute left-8 top-40 hidden -rotate-12 text-[#cd8188]/15 lg:block" aria-hidden="true">
        <PawPrint className="h-24 w-24" strokeWidth={1.4} />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 overflow-hidden rounded-[32px] border border-[#d6c8ad] bg-white/90 p-5 shadow-[0_18px_54px_rgba(101,88,79,0.10)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Link
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[#f5f1e8] shadow-[inset_0_0_0_1px_rgba(214,200,173,0.8)]"
              href={isShelterPortal ? workspaceBaseHref : "/admindraft"}
            >
              <Image
                alt="PawJai"
                className="object-contain p-2"
                fill
                priority
                sizes="80px"
                src="/pawjai-logo-square.png"
              />
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                {isShelterPortal ? "PawJai Shelter Portal" : "PawJai Admin Draft"}
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-[#65584f]">
                {isShelterPortal ? "My shelter workspace" : "Reorganized admin hierarchy"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65584f]/75">
                {isShelterPortal
                  ? `${selectedShelter.name} can manage its own profile, dogs, bookings, donations, and messages here.`
                  : "This draft keeps PawJai HQ, partner shelters, dogs, bookings, donations, ads, and content in one branded workspace without changing the adopter app."}
              </p>
              <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                connected ? "bg-[#eaf6df] text-[#3f6f24]" : "bg-[#f8e8ea] text-[#65584f]"
              }`}>
                <PawPrint className="h-4 w-4" />
                {connected
                  ? `Connected to Supabase: ${shelters.length} shelters, ${dogs.length} dogs, ${bookings.length} bookings, ${donations.length} donations`
                  : `Using fallback draft data${data?.error ? `: ${data.error}` : ""}`}
              </div>
            </div>
          </div>
          {accountSettingsHref ? (
            <div className="flex flex-wrap gap-2">
              <LanguageSwitcher />
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2.5 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
                href={accountSettingsHref}
              >
                Account settings
              </Link>
              <form action={signOutShelterPortalAction}>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#65584f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#65584f]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : lockRoleView ? (
            null
          ) : (
            <div className="flex flex-wrap gap-2">
              <PillButton active={role === "pawjai"} onClick={() => setRole("pawjai")}>View as PawJai</PillButton>
              <PillButton active={role === "shelter"} onClick={() => setRole("shelter")}>View as shelter</PillButton>
            </div>
          )}
          </div>
        </header>

        {initialMessage ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${/could not|choose|must|required|invalid|failed/i.test(initialMessage) ? "border-[#efc2be] bg-[#fff1f0] text-[#9a3129]" : "border-[#cfe2c5] bg-[#eef5ea] text-[#4f7847]"}`}>
            {initialMessage}
          </div>
        ) : null}

        {isPawjai ? (
          <nav className="mb-6 flex flex-wrap gap-3 rounded-[28px] border border-[#d6c8ad] bg-white/90 p-4 shadow-[0_14px_42px_rgba(101,88,79,0.08)] backdrop-blur">
            <PillButton active={mainTab === "shelters"} onClick={() => setMainTab("shelters")}>
              <Building2 className="mr-2 inline h-4 w-4" />
              Partner shelters
            </PillButton>
            <PillButton active={mainTab === "dogs"} onClick={() => setMainTab("dogs")}>
              <PawPrint className="mr-2 inline h-4 w-4" />
              All dog listings
            </PillButton>
            <PillButton active={mainTab === "bookings"} onClick={() => setMainTab("bookings")}>
              <CalendarDays className="mr-2 inline h-4 w-4" />
              Bookings
            </PillButton>
            <PillButton active={mainTab === "donations"} onClick={() => setMainTab("donations")}>
              <Banknote className="mr-2 inline h-4 w-4" />
              Donations
            </PillButton>
            <PillButton active={mainTab === "ads"} onClick={() => setMainTab("ads")}>
              <Megaphone className="mr-2 inline h-4 w-4" />
              Ads
            </PillButton>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href="/admindraft/aboutcontent"
            >
              <FileText className="mr-2 inline h-4 w-4" />
              About content
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href="/admindraft/accounts"
            >
              <Users className="mr-2 inline h-4 w-4" />
              Accounts
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href="/admindraft/audit"
            >
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Audit
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-2 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href="/admindraft/analytics"
            >
              <BarChart3 className="mr-2 inline h-4 w-4" />
              User analytics
            </Link>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-[#d6c8ad] px-4 py-2 text-xs font-semibold text-[#65584f]">
              <ShieldCheck className="h-4 w-4" />
              PawJai HQ only
            </div>
          </nav>
        ) : null}

        {isPawjai && mainTab === "shelters" ? (
          <PartnerSheltersTab
            bookings={selectedShelterBookings}
            dogs={selectedShelterDogs}
            donations={selectedShelterDonations}
            initialBookingView={bookingWorkspaceView}
            selectedShelter={selectedShelter}
            selectedShelterId={selectedShelter.id}
            setSelectedShelterId={setSelectedShelterId}
            shelters={shelters}
            shelterTab={shelterTab}
            setShelterTab={setShelterTab}
            messageThreads={messageThreads}
            messagesUnavailable={messagesUnavailable}
          />
        ) : null}
        {isPawjai && mainTab === "dogs" ? <AllDogsTab dogs={dogs} shelters={shelters} /> : null}
        {isPawjai && mainTab === "bookings" ? <GlobalBookingsTab bookings={bookings} shelters={shelters} /> : null}
        {isPawjai && mainTab === "donations" ? <DonationLedger donations={donations} returnTo="/admindraft?view=donations" shelters={shelters} showShelterFilter /> : null}
        {isPawjai && mainTab === "ads" ? (
          <AdsTab
            adClicks={adClicks}
            ads={ads}
            creativeSettings={adCreativeSettings}
          />
        ) : null}
        {isPawjai && mainTab === "about" ? <AboutTab about={about} /> : null}

        {!isPawjai ? (
          <ShelterWorkspace
            adminMode={false}
            bookingListHref={shelterWorkspaceBookingsHref}
            bookings={selectedShelterBookings}
            calendarReturnTo={shelterWorkspaceCalendarReturnTo}
            checkInHref={withReturnTo(bookingWorkspaceCheckInHref(shelterWorkspaceBookingsHref), shelterWorkspaceBookingsHref)}
            createDogHref={shelterWorkspaceCreateDogHref}
            dogEditHref={shelterWorkspaceDogEditHref}
            dogs={selectedShelterDogs}
            donationReturnTo={shelterWorkspaceDonationReturnTo}
            donations={selectedShelterDonations}
            initialBookingView={bookingWorkspaceView}
            messageThreads={messageThreads}
            messagesUnavailable={messagesUnavailable}
            profileReturnTo={isShelterPortal ? `${workspaceBaseHref}?view=profile` : adminDraftShelterWorkspaceHref(selectedShelter.id, "profile", draftShelterRole)}
            shelter={selectedShelter}
            tab={shelterTab}
            setTab={setShelterTab}
            workspaceBaseHref={isShelterPortal ? workspaceBaseHref : undefined}
          />
        ) : null}

        <footer className="mt-6 rounded-[24px] border border-[#d6c8ad] bg-white p-4 text-sm leading-6 text-[#65584f]">
          {isShelterPortal
            ? "This workspace is limited to your shelter account and its linked records."
            : "This workspace is limited to the PawJai Google admin session. Deep workflow links now keep PawJai admin and shelter portal users in their own lanes."}
        </footer>
      </div>
    </main>
  );
}
