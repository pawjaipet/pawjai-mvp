"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
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
  createShelterBlockoutAction,
  deleteShelterAvailabilityAction,
  decideBookingAction,
  toggleShelterBlockoutDateAction,
  updateShelterOperatingDaysAction,
  updateShelterProfileAction,
} from "@/app/admin/bookings/actions";
import { sendShelterAppointmentMessageAction, signOutShelterPortalAction } from "@/app/shelter/actions";
import DonationDetailsFields from "@/app/admin/bookings/DonationDetailsFields";
import type {
  AdminDraftAboutContent,
  AdminDraftAd,
  AdminDraftData,
  AdminDraftBooking,
  AdminDraftDog,
  AdminDraftShelter,
} from "@/utils/admin-draft-data";

type RoleView = "pawjai" | "shelter";
type MainTab = "shelters" | "dogs" | "bookings" | "ads" | "about";
type ShelterTab = "profile" | "dogs" | "bookings" | "messages";
type VisitBucket = "upcoming" | "needs_follow_up" | "past" | "all";
type MessageFilter = "all" | "unread" | "upcoming" | "needs_reply";
type AdStatusFilter = "all" | "live" | "paused" | "expired";
type AdminDraftMessageThread = AdminDraftData["messageThreads"][number];

const DRAFT_RETURN_TO = "/admindraft";
const MAIN_TABS: MainTab[] = ["shelters", "dogs", "bookings", "ads", "about"];
const BOOKING_STATUS_OPTIONS = ["requested", "confirmed", "completed", "cancelled", "no_show"];
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
      className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-[#d88c24] bg-[#d88c24] text-white shadow-[0_10px_22px_rgba(172,105,27,0.18)]"
          : "border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
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
    <section className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6b2a]">{eyebrow}</p> : null}
      <h2 className={eyebrow ? "mt-2 text-2xl font-semibold text-[#4f4338]" : "text-2xl font-semibold text-[#4f4338]"}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldGrid({ fields }: { fields: string[] }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold text-[#5b4d40]" key={field}>
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

function bookingStatusClass(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "completed":
      return "bg-[#e9f2ff] text-[#285f9d]";
    case "cancelled":
      return "bg-[#f7e3e1] text-[#9a3129]";
    case "no_show":
      return "bg-[#f1e7db] text-[#8a5825]";
    default:
      return "bg-[#fff1dc] text-[#a86a1f]";
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

function getAdStatus(ad: AdminDraftAd, today: string): Exclude<AdStatusFilter, "all"> {
  if (ad.endDate < today) return "expired";
  return ad.isActive ? "live" : "paused";
}

function adStatusLabel(status: Exclude<AdStatusFilter, "all">) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function matchesAdFilters(ad: AdminDraftAd, search: string, status: AdStatusFilter, today: string) {
  const query = search.trim().toLowerCase();
  const searchable = [ad.companyName, ad.clickUrl, ad.startDate, ad.endDate]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const adStatus = getAdStatus(ad, today);

  return (!query || searchable.includes(query)) && (status === "all" || adStatus === status);
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
    <article className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffdfa]">
      <div className="flex aspect-[16/9] items-center justify-center bg-[#f3e7d5] text-[#9a6b2a]">
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
          <h3 className="text-lg font-semibold text-[#4f4338]">{dog.name}</h3>
          <p className="mt-1 text-sm text-[#74685d]">{dog.breed}</p>
        </div>
        <span className="rounded-full bg-[#f8ecd8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a6b2a]">
          {formatStatus(dog.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#74685d]">{dog.shelterName}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#8d7f72]">
        <span>{dog.photosCount} photos</span>
        {dog.gender ? <span>{formatStatus(dog.gender)}</span> : null}
        {dog.size ? <span>{formatStatus(dog.size)}</span> : null}
        {dog.energyLevel ? <span>{formatStatus(dog.energyLevel)}</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          className="inline-flex items-center justify-center rounded-full bg-[#d88c24] px-4 py-2 text-sm font-semibold text-white"
          href={editHref}
        >
          Edit
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
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
  icon,
  meta,
  onClick,
}: {
  active: boolean;
  adminMode: boolean;
  children: React.ReactNode;
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

  return (
    <button
      className={`flex aspect-square min-h-32 flex-col justify-between rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#d88c24] bg-[#fff3df] text-[#4f4338] shadow-[0_12px_28px_rgba(172,105,27,0.14)]"
          : "border-[#eadfce] bg-[#fffdfa] text-[#5b4d40] hover:bg-[#faf4ec]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#b77624]">
        {icon}
      </span>
      <span>
        <span className="block text-base font-semibold">{children}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">{meta}</span>
      </span>
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
        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2 text-center text-sm font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
        href={href}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      className="flex aspect-square min-h-32 flex-col justify-between rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 text-left text-[#5b4d40] transition hover:bg-[#faf4ec]"
      href={href}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#b77624]">
        {icon}
      </span>
      <span>
        <span className="block text-base font-semibold">{children}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">{meta}</span>
      </span>
    </Link>
  );
}

function ShelterProfileTab({ returnTo, shelter }: { returnTo: string; shelter: AdminDraftShelter }) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const addressParts = shelterAddressParts(shelter);
  const mapsUrl = shelterMapsUrl(shelter);
  const unavailableRanges = (shelter.availability ?? []).filter((range) => range.availabilityType === "unavailable");
  const singleDayBlockouts = new Map(
    unavailableRanges
      .filter((range) => range.startDate === range.endDate)
      .map((range) => [range.startDate, range]),
  );
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
  const defaultOpensAt = sampleOpenDay?.opensAt?.slice(0, 5) ?? "09:00";
  const defaultClosesAt = sampleOpenDay?.closesAt?.slice(0, 5) ?? "17:00";
  const defaultSlotDuration = sampleOpenDay?.slotDurationMinutes ?? regularHours[0]?.slotDurationMinutes ?? 60;
  const calendarDays = buildCalendarDays(calendarMonth);
  const previousCalendarMonth = new Date(calendarMonth);
  previousCalendarMonth.setMonth(calendarMonth.getMonth() - 1);
  const nextCalendarMonth = new Date(calendarMonth);
  nextCalendarMonth.setMonth(calendarMonth.getMonth() + 1);
  const inputClass = "w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d38a2c]";
  const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]";

  return (
    <div className="space-y-6">
      <Section eyebrow="Shelter profile" title={shelter.name}>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p className="text-sm leading-6 text-[#74685d]">
              This profile feeds meeting location, shelter contact, donation details, and shelter calendar data.
            </p>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#eadfce] text-[#8d7f72]">
                {shelter.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${shelter.name} logo`} className="h-full w-full object-cover" src={shelter.logoUrl} />
                ) : (
                  <ImageIcon className="h-7 w-7" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#4f4338]">Shelter logo</p>
                <p className="mt-1 text-xs leading-5 text-[#74685d]">
                  Paste a hosted logo URL or upload a new PNG, JPG, or WEBP file.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-[#f8f0e5] p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-[#9a6b2a]" size={18} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Meeting at</p>
                    <p className="mt-1 text-base font-semibold text-[#4f4338]">{shelter.name}</p>
                    <p className="mt-1 text-sm leading-6 text-[#74685d]">
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
                      <p className="mt-2 text-xs leading-5 text-[#74685d]">{shelter.meetingInstructions}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8f0e5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter contact</p>
                <div className="mt-3 grid gap-2 text-sm text-[#74685d]">
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
                <span className={labelClass}>Booking notification email</span>
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
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-2.5 text-sm text-[#4f4338] file:mr-3 file:rounded-full file:border-0 file:bg-[#d38a2c] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#d38a2c]"
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

            <label>
              <span className={labelClass}>Internal profile note</span>
              <textarea className={`${inputClass} min-h-24 resize-none`} defaultValue={shelter.description ?? ""} name="description" placeholder="Meeting instructions, parking notes, or shelter context for staff" />
            </label>

            <input name="facebookUrl" type="hidden" value={shelter.facebookUrl ?? ""} />
            <input name="instagramUrl" type="hidden" value={shelter.instagramUrl ?? ""} />
            <DonationDetailsFields
              bankAccountName={shelter.bankAccountName ?? null}
              bankAccountNumber={shelter.bankAccountNumber ?? null}
              bankName={shelter.bankName ?? null}
              promptpayId={shelter.promptpayId ?? null}
            />
            <button className="mt-1 inline-flex items-center justify-center rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
              Save shelter profile
            </button>
          </form>
        </div>
      </Section>

      <Section eyebrow="Shelter calendar" title="Blockout dates">
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div>
            <p className="text-sm leading-6 text-[#74685d]">
              Click dates to close or reopen one-off holidays. Set recurring closed weekdays for regular non-operating days.
            </p>
            <form action={updateShelterOperatingDaysAction} className="mt-5 rounded-2xl bg-[#fffdfa] p-4">
              <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Weekly closed days</p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAYS.map((day) => (
                  <label
                    className="cursor-pointer rounded-2xl border border-[#eadfce] bg-white px-3 py-3 text-center text-xs font-semibold text-[#5b4d40] has-[:checked]:border-[#c46f75] has-[:checked]:bg-[#c46f75] has-[:checked]:text-white"
                    key={day.value}
                  >
                    <input
                      className="sr-only"
                      defaultChecked={closedDays.has(day.value)}
                      name="closedDays"
                      type="checkbox"
                      value={day.value}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label>
                  <span className={labelClass}>Opens</span>
                  <input className={inputClass} defaultValue={defaultOpensAt} name="opensAt" type="time" />
                </label>
                <label>
                  <span className={labelClass}>Closes</span>
                  <input className={inputClass} defaultValue={defaultClosesAt} name="closesAt" type="time" />
                </label>
                <label>
                  <span className={labelClass}>Slot minutes</span>
                  <input className={inputClass} defaultValue={defaultSlotDuration} min="15" name="slotDuration" step="15" type="number" />
                </label>
              </div>
              <button className="mt-4 w-full rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                Save weekly schedule
              </button>
            </form>
          </div>

          <div>
            <div className="rounded-2xl bg-[#fffdfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                  onClick={() => setCalendarMonth(previousCalendarMonth)}
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-lg font-semibold text-[#4f4338]">{formatMonthLabel(calendarMonth)}</p>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                  onClick={() => setCalendarMonth(nextCalendarMonth)}
                  type="button"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">
                {WEEKDAYS.map((day) => (
                  <span key={day.value}>{day.label}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((date) => {
                  const dateKey = isoDate(date);
                  const inMonth = date.getMonth() === calendarMonth.getMonth();
                  const recurringClosed = closedDays.has(date.getDay());
                  const blockout = singleDayBlockouts.get(dateKey);
                  const isClosed = recurringClosed || Boolean(blockout);
                  return (
                    <form action={toggleShelterBlockoutDateAction} key={dateKey}>
                      <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
                      <input name="date" type="hidden" value={dateKey} />
                      <input name="availabilityId" type="hidden" value={blockout?.id ?? ""} />
                      <button
                        className={`flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${
                          isClosed
                            ? "border-[#65584f] bg-[#65584f] text-white"
                            : "border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
                        } ${inMonth ? "" : "opacity-35"} ${recurringClosed ? "cursor-not-allowed" : ""}`}
                        disabled={recurringClosed}
                        title={recurringClosed ? "Recurring closed day" : blockout ? "Click to reopen this date" : "Click to block this date"}
                        type="submit"
                      >
                        {date.getDate()}
                      </button>
                    </form>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#74685d]">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#65584f]" /> Closed</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded border border-[#eadfce] bg-white" /> Open</span>
              </div>
            </div>

            <form action={createShelterBlockoutAction} className="mt-4 grid gap-3 rounded-2xl bg-[#fffdfa] p-4 md:grid-cols-[1fr_1fr_minmax(0,1.3fr)_auto] md:items-end">
              <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
              <label>
                <span className={labelClass}>From</span>
                <input className={inputClass} name="startDate" required type="date" />
              </label>
              <label>
                <span className={labelClass}>To</span>
                <input className={inputClass} name="endDate" type="date" />
              </label>
              <label>
                <span className={labelClass}>Reason</span>
                <input className={inputClass} name="note" placeholder="Holiday, staff training, fully booked" />
              </label>
              <button className="rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white hover:bg-[#bf781f]" type="submit">
                Add
              </button>
            </form>

            <div className="mt-4 grid gap-2">
              {unavailableRanges.length > 0 ? (
                unavailableRanges.map((range) => (
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#eadfce] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between" key={range.id}>
                    <div>
                      <p className="text-sm font-semibold text-[#4f4338]">
                        {formatShortDate(range.startDate)}
                        {range.endDate !== range.startDate ? ` - ${formatShortDate(range.endDate)}` : ""}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#74685d]">
                        {range.note?.startsWith("Recurring weekly closure:")
                          ? "Weekly closure"
                          : range.note || "Unavailable"}
                      </p>
                    </div>
                    <form action={deleteShelterAvailabilityAction}>
                      <DraftReturnFields returnTo={returnTo} shelterId={shelter.id} />
                      <input name="availabilityId" type="hidden" value={range.id} />
                      <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-xs font-semibold text-[#9a3129] hover:bg-[#fff6f4]" type="submit">
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] px-4 py-5 text-sm text-[#74685d]">
                  No blockout dates set for {shelter.name}.
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
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
  const filteredDogs = dogs.filter((dog) => matchesDogFilters(dog, search, status));

  return (
    <div className="space-y-6">
      <Section eyebrow="Dog listings" title={`${shelter.name} dogs`}>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#74685d]">
            Shelter staff can manage their own dogs here. PawJai HQ can see the same list from the shelter umbrella.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="sr-only" htmlFor="shelter-dog-search">Search shelter dogs</label>
          <input
            className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
            id="shelter-dog-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dog name, breed, size"
            type="search"
            value={search}
          />
          <label className="sr-only" htmlFor="shelter-dog-status">Filter by status</label>
          <select
            className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
            id="shelter-dog-status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="draft">Draft</option>
            <option value="reserved">Reserved</option>
            <option value="adopted">Adopted</option>
          </select>
          <button
            className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40]"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
            type="button"
          >
            Reset
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredDogs.slice(0, 12).map((dog) => (
            <DogCard dog={dog} editHref={dogEditHref(dog)} key={dog.id} />
          ))}
          {filteredDogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
              No dog listings match this view for {shelter.name}.
            </div>
          ) : null}
        </div>
      </Section>

    </div>
  );
}

function ShelterBookingsTab({
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
  const now = new Date();
  const bucketCounts = useMemo(() => ({
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
  }), [bookings, now]);
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
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-5" key={label}>
            <p className="text-sm font-semibold text-[#9a6b2a]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#4f4338]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
          Visit timing
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {VISIT_BUCKETS.map((bucket) => (
            <button
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                visitBucket === bucket.value
                  ? "bg-[#d88c24] text-white shadow-[0_10px_24px_rgba(179,111,31,0.18)]"
                  : "border border-[#eadfce] bg-[#fffdfa] text-[#5b4d40] hover:bg-[#faf4ec]"
              }`}
              key={bucket.value}
              onClick={() => setVisitBucket(bucket.value)}
              type="button"
            >
              {bucket.label} ({bucketCounts[bucket.value]})
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-[#74685d]">
          Visits move to past 24 hours after their scheduled time. Needs follow-up highlights visits where staff should record the outcome.
        </p>
      </div>

      <div className="mt-5 grid gap-4 rounded-[24px] border border-[#eadfce] bg-white p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Date</span>
          <input
            className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
            onChange={(event) => setBookingDateFilter(event.target.value)}
            type="date"
            value={bookingDateFilter}
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</span>
          <select
            className="w-full rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
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
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white" type="button">
          <Search className="h-4 w-4" />
          Filter
        </button>
        <button
          className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40]"
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
        className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">
            Search booking code
          </span>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#4f4338] outline-none focus:border-[#d88c24]"
              onChange={(event) => setBookingSearch(event.target.value)}
              placeholder="APT-FA5C9"
              value={bookingSearch}
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white" type="submit">
              <Search className="h-4 w-4" />
              Search code
            </button>
          </div>
        </label>
        <p className="mt-3 text-xs leading-5 text-[#74685d]">
          Type the visitor booking ID from their appointment card or QR screen.
        </p>
      </form>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-[#eadfce] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#4f4338]">QR check-in scanner</p>
          <p className="mt-1 text-sm text-[#74685d]">Scan a visitor appointment QR to open their booking profile.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white"
          href={checkInHref}
        >
          <QrCode className="h-4 w-4" />
          Scan QR
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {visibleBookings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#eadfce] bg-white p-8 text-center">
            <p className="text-xl font-semibold text-[#4f4338]">No bookings match this view.</p>
            <p className="mt-2 text-sm text-[#74685d]">Try clearing filters or choosing a different date.</p>
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
                className="rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]"
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f7ecda] px-3 py-1 text-xs font-bold text-[#8a5825]">
                        <QrCode className="h-3.5 w-3.5" />
                        {formatBookingDisplayCode(booking)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visit</p>
                        <p className="mt-1 text-lg font-semibold text-[#4f4338]">{formatBookingDate(booking.appointmentDate)}</p>
                        <p className="text-sm text-[#74685d]">{formatBookingTime(booking.appointmentTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Adopter</p>
                        <p className="mt-1 text-lg font-semibold text-[#4f4338]">{booking.adopterName}</p>
                        <p className="break-words text-sm text-[#74685d]">{booking.adopterEmail ?? "No email"}</p>
                        <p className="text-sm text-[#74685d]">{booking.adopterPhoneNumber ?? "No phone"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Dog and Shelter</p>
                        <p className="mt-1 text-lg font-semibold text-[#4f4338]">{bookingDogLabel(booking)}</p>
                        <p className="text-sm text-[#74685d]">{booking.shelterName}</p>
                        <p className="text-sm text-[#74685d]">{[booking.shelterDistrict, booking.shelterProvince].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>

                    {booking.visitorNote ? (
                      <div className="mt-4 rounded-2xl bg-[#f8f0e5] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visitor note</p>
                        <p className="mt-1 text-sm leading-6 text-[#5b4d40]">{booking.visitorNote}</p>
                      </div>
                    ) : null}
                  </div>

                  <form action={decideBookingAction} className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
                    <input name="appointmentId" type="hidden" value={booking.id} />
                    <input name="returnTo" type="hidden" value={bookingListHref} />
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Status</p>
                      <p className="mt-1 text-lg font-semibold text-[#4f4338]">{bookingDecisionLabel(booking.status)}</p>
                      {booking.shelterNote ? (
                        <p className="mt-2 text-sm leading-6 text-[#74685d]">{booking.shelterNote}</p>
                      ) : null}
                      {booking.proposedAppointmentDate && booking.proposedAppointmentTime ? (
                        <p className="mt-2 rounded-xl bg-[#fff1dc] px-3 py-2 text-xs font-semibold text-[#8a5825]">
                          Proposed: {formatBookingDate(booking.proposedAppointmentDate)} at {formatBookingTime(booking.proposedAppointmentTime)}
                        </p>
                      ) : null}
                    </div>

                    <label className="mt-3 block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter note</span>
                      <textarea
                        className="min-h-[92px] w-full resize-none rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
                        defaultValue={booking.shelterNote ?? ""}
                        name="shelterNote"
                        placeholder="Optional note for denial, date change, or staff context"
                      />
                    </label>

                    <details className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3" open={booking.status === "requested"}>
                      <summary className="cursor-pointer text-sm font-semibold text-[#5b4d40]">
                        Edit decision
                      </summary>
                      <div className="mt-3 grid gap-2">
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fffaf3] p-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New date</span>
                            <input
                              className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
                              defaultValue={booking.proposedAppointmentDate ?? booking.appointmentDate}
                              min={new Date().toISOString().slice(0, 10)}
                              name="proposedAppointmentDate"
                              type="date"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">New time</span>
                            <select
                              className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
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
                        <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" name="decision" type="submit" value="request_change">
                          Ask to change date/time
                        </button>
                      </div>
                    </details>

                    {followUpDue ? (
                      <div className="mt-3 rounded-2xl border border-[#eadfce] bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Post-visit outcome</p>
                        <div className="mt-3 grid gap-2">
                          <button className="w-full rounded-full bg-[#65584f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#50443b]" name="decision" type="submit" value="complete">
                            Mark visit completed
                          </button>
                          <button className="w-full rounded-full border border-[#d8c7ab] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" name="decision" type="submit" value="no_show">
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
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                      href={withReturnTo(`/booking/${booking.id}/visitor-profile`, bookingListHref)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open visitor profile
                    </Link>
            <Link
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
              href={withReturnTo(`/booking/${booking.id}`, bookingListHref)}
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

  return (
    <Section eyebrow="Messaging" title="Visitor conversations">
      {adminMode ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f8ecd8] px-4 py-2 text-xs font-semibold text-[#9a6b2a]">
          <ShieldCheck className="h-4 w-4" />
          Read-only PawJai admin view
        </div>
      ) : null}
      {messagesUnavailable ? (
        <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fff8ed] p-4 text-sm leading-6 text-[#7a5a2e]">
          Messages are temporarily unavailable. Booking and dog management remain available.
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#4f4338]">{shelterThreads.length} appointment threads</p>
              <p className="mt-1 text-sm text-[#74685d]">{shelter.unreadMessageCount} unread adopter messages</p>
            </div>
            <MessageCircle className="h-5 w-5 text-[#d88c24]" />
          </div>
          <label className="sr-only" htmlFor={`message-search-${shelter.id}`}>Search message threads</label>
          <input
            className="mt-4 w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
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
                    ? "border-[#d88c24] bg-[#d88c24] text-white"
                    : "border-[#eadfce] bg-white text-[#5b4d40]"
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
                    ? "border-[#d88c24] bg-[#fff7eb]"
                    : "border-[#eadfce] bg-white hover:bg-[#faf4ec]"
                }`}
                key={thread.appointmentId}
                onClick={() => setSelectedThreadId(thread.appointmentId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#4f4338]">{thread.adopterName}</p>
                    <p className="mt-1 truncate text-xs text-[#74685d]">{thread.dogName} · {thread.bookingCode}</p>
                  </div>
                  {thread.unreadForShelterCount > 0 ? (
                    <span className="rounded-full bg-[#d88c24] px-2 py-0.5 text-xs font-semibold text-white">
                      {thread.unreadForShelterCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#74685d]">
                  {thread.latestMessage?.body ?? "No messages yet. Conversation opens after a booked visit."}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8b7b]">
                  {formatMessageTime(thread.latestMessage?.created_at ?? `${thread.appointmentDate}T${thread.appointmentTime}`)}
                </p>
              </button>
            ))}
            {filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#eadfce] bg-white p-4 text-sm text-[#74685d]">
                No message threads match these filters.
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
          {selectedThread ? (
            <div>
              <div className="flex flex-col gap-3 border-b border-[#eadfce] pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">{selectedThread.bookingCode}</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#4f4338]">{selectedThread.dogName} with {selectedThread.adopterName}</h3>
                  <p className="mt-1 text-sm text-[#74685d]">
                    {formatBookingDate(selectedThread.appointmentDate)} at {formatBookingTime(selectedThread.appointmentTime)} · {formatStatus(selectedThread.status)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                    href={withReturnTo(`/booking/${selectedThread.appointmentId}`, returnTo)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Booking
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
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

                  return (
                    <div className={`flex ${isShelter ? "justify-end" : "justify-start"}`} key={message.id}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isShelter ? "bg-[#65584f] text-white" : "bg-[#f8f0e5] text-[#4f4338]"
                      }`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isShelter ? "text-white/70" : "text-[#8d7f72]"}`}>
                          {message.sender_role === "system" ? "PawJai/system" : message.sender_label ?? (isShelter ? shelter.name : selectedThread.adopterName)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                        {message.attachment_url ? (
                          <a
                            className={`mt-2 inline-flex text-xs font-semibold underline ${isShelter ? "text-white" : "text-[#9a6b2a]"}`}
                            href={message.attachment_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {message.attachment_name ?? "View attachment"}
                          </a>
                        ) : null}
                        <p className={`mt-2 text-[11px] ${isShelter ? "text-white/60" : "text-[#74685d]/70"}`}>
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-5 text-sm text-[#74685d]">
                    No conversation selected yet. The first adopter or shelter message will appear here.
                  </div>
                )}
              </div>
              {adminMode ? (
                <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 text-sm text-[#74685d]">
                  Read-only PawJai admin view. Admin can review this conversation but cannot reply, edit, or mark shelter messages read.
                </div>
              ) : (
                <form action={sendShelterAppointmentMessageAction} className="mt-4 grid gap-2" encType="multipart/form-data">
                  <input name="appointmentId" type="hidden" value={selectedThread.appointmentId} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <label className="sr-only" htmlFor={`message-body-${selectedThread.appointmentId}`}>Write a shelter reply</label>
                  <div className="flex gap-2">
                    <textarea
                      className="min-h-12 flex-1 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
                      disabled={messagesUnavailable}
                      id={`message-body-${selectedThread.appointmentId}`}
                      name="body"
                      placeholder={messagesUnavailable ? "Messaging temporarily unavailable" : "Write a shelter reply..."}
                    />
                    <button
                      className="h-12 rounded-full bg-[#d88c24] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#d6c8ad]"
                      disabled={messagesUnavailable}
                      type="submit"
                    >
                      Send
                    </button>
                  </div>
                  <label
                    className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                    htmlFor={`shelter-attachment-${selectedThread.appointmentId}`}
                  >
                    <FileText className="h-4 w-4" />
                    Attach file
                  </label>
                  <input
                    accept="image/png,image/jpeg,image/webp,application/pdf"
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
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-center text-sm text-[#74685d]">
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
  checkInHref,
  createDogHref,
  dogEditHref,
  dogs,
  messageThreads,
  messagesUnavailable,
  profileReturnTo,
  shelter,
  tab,
  setTab,
}: {
  adminMode: boolean;
  bookingListHref: string;
  bookings: AdminDraftBooking[];
  checkInHref: string;
  createDogHref: string;
  dogEditHref: (dog: AdminDraftDog) => string;
  dogs: AdminDraftDog[];
  messageThreads: AdminDraftMessageThread[];
  messagesUnavailable: boolean;
  profileReturnTo: string;
  shelter: AdminDraftShelter;
  tab: ShelterTab;
  setTab: (tab: ShelterTab) => void;
}) {
  return (
    <div className="space-y-6">
      <Section eyebrow={adminMode ? "Partner shelter workspace" : "My Shelter Workspace powered by PAWJAI"} title={shelter.name}>
        <div className={`mt-5 grid gap-3 ${adminMode ? "md:grid-cols-5" : "grid-cols-2 md:grid-cols-5"}`}>
          <ShelterWorkspaceTabButton
            active={tab === "profile"}
            adminMode={adminMode}
            icon={<Building2 className="h-5 w-5" />}
            meta="Identity"
            onClick={() => setTab("profile")}
          >
            Shelter profile
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceTabButton
            active={tab === "dogs"}
            adminMode={adminMode}
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
            icon={<CalendarDays className="h-5 w-5" />}
            meta={`${bookings.length} visits`}
            onClick={() => setTab("bookings")}
          >
            Booking visits
          </ShelterWorkspaceTabButton>
          <ShelterWorkspaceTabButton
            active={tab === "messages"}
            adminMode={adminMode}
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
      {tab === "bookings" ? <ShelterBookingsTab bookingListHref={bookingListHref} bookings={bookings} checkInHref={checkInHref} /> : null}
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
        <p className="mt-2 text-sm leading-6 text-[#74685d]">
          PawJai HQ lands here first. Open a shelter to see its profile, create dog profiles, dog listings, booking visits, and messaging.
        </p>
        <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-2">
          {shelters.map((shelter) => (
            <button
              className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition ${
                shelter.id === selectedShelterId ? "border-[#d88c24] bg-[#d88c24] text-white" : "border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
              }`}
              key={shelter.id}
              onClick={() => setSelectedShelterId(shelter.id)}
              type="button"
            >
              <p className="font-semibold">{shelter.name}</p>
              <p className={`mt-1 text-sm ${shelter.id === selectedShelterId ? "text-white/75" : "text-[#74685d]"}`}>{shelter.location}</p>
              <div className={`mt-3 flex gap-2 text-xs font-semibold ${shelter.id === selectedShelterId ? "text-white/80" : "text-[#8d7f72]"}`}>
                <span>{shelter.dogsCount} dogs</span>
                <span>{shelter.pendingBookingsCount} pending visits</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Selected shelter</p>
            <p className="mt-2 font-semibold text-[#4f4338]">{selectedShelter.name}</p>
            <p className="mt-1 text-sm text-[#74685d]">{selectedShelter.location}</p>
          </div>
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Listings</p>
            <p className="mt-2 text-2xl font-semibold text-[#4f4338]">{selectedShelter.dogsCount}</p>
            <p className="mt-1 text-sm text-[#74685d]">dogs under this shelter</p>
          </div>
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Bookings</p>
            <p className="mt-2 text-2xl font-semibold text-[#4f4338]">{selectedShelter.pendingBookingsCount}</p>
            <p className="mt-1 text-sm text-[#74685d]">pending visits</p>
          </div>
        </div>
      </Section>
      <ShelterWorkspace
        adminMode
        bookingListHref={`/admindraft?shelter=${selectedShelter.id}&view=bookings`}
        bookings={bookings}
        checkInHref={withReturnTo("/booking/check-in", `/admindraft?shelter=${selectedShelter.id}&view=bookings`)}
        createDogHref={`/admindraft/dog-creation?shelter=${selectedShelter.id}`}
        dogEditHref={(dog) => `/admindraft/dogs/${dog.id}/edit`}
        dogs={dogs}
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
      <p className="mt-2 text-sm leading-6 text-[#74685d]">
        This is the global dog listing view that does not require entering a shelter first.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto_auto]">
        <label className="sr-only" htmlFor="all-dog-search">Search dogs</label>
        <input
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
          id="all-dog-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dog, breed, shelter, size"
          type="search"
          value={search}
        />
        <label className="sr-only" htmlFor="all-dog-shelter">Filter dogs by shelter</label>
        <select
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
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
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
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
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white" type="button">
          <Search className="h-4 w-4" />
          {filteredDogs.length} dogs
        </button>
        <button
          className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40]"
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
          <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
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
      <p className="mt-2 text-sm leading-6 text-[#74685d]">
        PawJai HQ can still see bookings across shelters here. Shelter users only see the booking tab inside their own workspace.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-[260px_auto]">
        <label className="sr-only" htmlFor="booking-shelter-filter">Filter bookings by shelter</label>
        <select
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
          id="booking-shelter-filter"
          onChange={(event) => setShelterId(event.target.value)}
          value={shelterId}
        >
          {shelterFilterOptions(shelters).map((shelter) => (
            <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
          ))}
        </select>
        <button
          className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40]"
          onClick={() => setShelterId("all")}
          type="button"
        >
          Show all shelters
        </button>
      </div>
      <ShelterBookingsTab
        bookingListHref={bookingListHref}
        bookings={filteredBookings}
        checkInHref={withReturnTo("/booking/check-in", bookingListHref)}
      />
    </Section>
  );
}

function AdsTab({ ads }: { ads: AdminDraftAd[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdStatusFilter>("all");
  const today = new Date().toISOString().slice(0, 10);
  const filteredAds = ads.filter((ad) => matchesAdFilters(ad, search, status, today));

  return (
    <Section eyebrow="Ads" title="PawJai-managed ads">
      <p className="mt-2 text-sm leading-6 text-[#74685d]">
        Partner submissions from /ads land in the same ads table. PawJai reviews, pauses, and date-edits records internally. Connected ads: {ads.length}.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
        <label className="sr-only" htmlFor="admin-ad-search">Search ads</label>
        <input
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
          id="admin-ad-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search advertiser or URL"
          type="search"
          value={search}
        />
        <label className="sr-only" htmlFor="admin-ad-status">Filter ads by status</label>
        <select
          className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
          id="admin-ad-status"
          onChange={(event) => setStatus(event.target.value as AdStatusFilter)}
          value={status}
        >
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="paused">Paused</option>
          <option value="expired">Expired</option>
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white" type="button">
          <Search className="h-4 w-4" />
          {filteredAds.length} ads
        </button>
        <button
          className="rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40]"
          onClick={() => {
            setSearch("");
            setStatus("all");
          }}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className="mt-6 grid gap-3">
        {filteredAds.map((ad) => {
          const adStatus = getAdStatus(ad, today);
          const label = adStatusLabel(adStatus);

          return (
            <article className="grid gap-4 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 md:grid-cols-[96px_minmax(0,1fr)_auto]" key={ad.id}>
              <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#f3e7d5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={ad.companyName} className="h-full w-full object-cover" src={ad.imageUrl} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#4f4338]">{ad.companyName}</h3>
                  <span className="rounded-full bg-[#f8ecd8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a6b2a]">
                    {label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#74685d]">{ad.startDate} to {ad.endDate}</p>
                <a className="mt-1 block truncate text-sm font-semibold text-[#b77624]" href={ad.clickUrl} rel="noopener noreferrer" target="_blank">
                  {ad.clickUrl}
                </a>
              </div>
              <div className="flex flex-wrap items-start gap-2 md:flex-col">
                <Link
                  className="inline-flex rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
                  href="/admin/ads"
                >
                  Edit dates
                </Link>
                <Link
                  className="inline-flex rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
                  href="/admin/ads"
                >
                  {ad.isActive ? "Pause" : "Resume"}
                </Link>
              </div>
            </article>
          );
        })}
        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
            No ad records are connected yet.
          </div>
        ) : null}
        {ads.length > 0 && filteredAds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
            No ads match these filters.
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function AboutTab({ about }: { about: AdminDraftAboutContent | null }) {
  return (
    <Section eyebrow="About content" title="PawJai profile content">
      <p className="mt-2 text-sm leading-6 text-[#74685d]">
        This stays PawJai-only and manages the public About page content.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Mission title</p>
          <h3 className="mt-2 text-xl font-semibold text-[#4f4338]">{about?.missionTitle ?? "No mission title saved yet"}</h3>
          <p className="mt-3 text-sm leading-6 text-[#74685d]">{about?.missionBody ?? "No mission body saved yet."}</p>
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Hero slogan</p>
          <p className="mt-2 text-lg font-semibold text-[#4f4338]">{about?.heroSlogan ?? "No hero slogan saved yet"}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Partner shelters in About content</p>
          <p className="mt-2 text-3xl font-semibold text-[#4f4338]">{about?.partnerSheltersCount ?? 0}</p>
        </div>
      </div>
      <FieldGrid fields={["Mission title", "Mission body", "Partner shelters", "Hero copy", "Impact numbers", "Save About content"]} />
      <Link
        className="mt-5 inline-flex rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white"
        href="/admin/pawjaiprofile"
      >
        Edit live About content
      </Link>
    </Section>
  );
}

function isShelterTab(value: string | undefined): value is ShelterTab {
  return value === "profile" || value === "dogs" || value === "bookings" || value === "messages";
}

export default function AdminReorgDraftPanel({
  accountSettingsHref,
  data,
  initialMainTab,
  initialRoleView = "pawjai",
  initialShelterId,
  initialShelterTab,
  lockRoleView = false,
  workspaceBaseHref = DRAFT_RETURN_TO,
}: {
  accountSettingsHref?: string;
  data?: AdminDraftData;
  initialMainTab?: string;
  initialRoleView?: RoleView;
  initialShelterId?: string;
  initialShelterTab?: string;
  lockRoleView?: boolean;
  workspaceBaseHref?: string;
}) {
  const shelters = data?.shelters.length ? data.shelters : fallbackShelters;
  const dogs = data?.dogs.length ? data.dogs : fallbackDogs;
  const bookings = data?.bookings.length ? data.bookings : fallbackBookings;
  const messageThreads = data?.messageThreads ?? [];
  const messagesUnavailable = data?.messagesUnavailable ?? false;
  const ads = data?.ads ?? [];
  const about = data?.about ?? null;
  const [role, setRole] = useState<RoleView>(initialRoleView);
  const [mainTab, setMainTab] = useState<MainTab>(isMainTab(initialMainTab) ? initialMainTab : "shelters");
  const [selectedShelterId, setSelectedShelterId] = useState(
    initialShelterId && shelters.some((shelter) => shelter.id === initialShelterId)
      ? initialShelterId
      : shelters[0]?.id ?? "",
  );
  const [shelterTab, setShelterTab] = useState<ShelterTab>(isShelterTab(initialShelterTab) ? initialShelterTab : "profile");

  const isPawjai = role === "pawjai";
  const selectedShelter = shelters.find((shelter) => shelter.id === selectedShelterId) ?? shelters[0] ?? fallbackShelters[0];
  const selectedShelterDogs = dogs.filter((dog) => dog.shelterId === selectedShelter.id);
  const selectedShelterBookings = bookings.filter((booking) => booking.shelterId === selectedShelter.id);
  const connected = data?.source === "supabase";
  const isShelterPortal = workspaceBaseHref.startsWith("/shelter/");
  const shelterWorkspaceBookingsHref = isShelterPortal
    ? `${workspaceBaseHref}?view=bookings`
    : `/admindraft?shelter=${selectedShelter.id}&view=bookings`;
  const shelterWorkspaceCreateDogHref = isShelterPortal
    ? `${workspaceBaseHref}/dogs/new`
    : `/admindraft/dog-creation?shelter=${selectedShelter.id}`;
  const shelterWorkspaceDogEditHref = (dog: AdminDraftDog) => isShelterPortal
    ? `${workspaceBaseHref}/dogs/${dog.id}/edit`
    : `/admindraft/dogs/${dog.id}/edit`;

  return (
    <main className="min-h-screen bg-[#f5efe6] px-4 py-8 text-[#4f4338]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
              PawJai Admin Draft
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Reorganized admin hierarchy</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#74685d]">
              This local draft rearranges the working admin pages you already have. PawJai sees the shelter umbrella first. Shelter users see only their shelter workspace.
            </p>
            <div className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
              connected ? "bg-[#eaf6df] text-[#3f6f24]" : "bg-[#fff1dc] text-[#8a5825]"
            }`}>
              {connected
                ? `Connected to Supabase: ${shelters.length} shelters, ${dogs.length} dogs, ${bookings.length} bookings`
                : `Using fallback draft data${data?.error ? `: ${data.error}` : ""}`}
            </div>
          </div>
          {accountSettingsHref ? (
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2.5 text-sm font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
                href={accountSettingsHref}
              >
                Account settings
              </Link>
              <form action={signOutShelterPortalAction}>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#65584f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4f4338]"
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
        </header>

        {isPawjai ? (
          <nav className="mb-6 flex flex-wrap gap-3 rounded-[28px] border border-[#eadfce] bg-white p-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
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
            <PillButton active={mainTab === "ads"} onClick={() => setMainTab("ads")}>
              <Megaphone className="mr-2 inline h-4 w-4" />
              Ads
            </PillButton>
            <PillButton active={mainTab === "about"} onClick={() => setMainTab("about")}>
              <FileText className="mr-2 inline h-4 w-4" />
              About content
            </PillButton>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-[#f8ecd8] px-4 py-2 text-xs font-semibold text-[#9a6b2a]">
              <ShieldCheck className="h-4 w-4" />
              PawJai HQ only
            </div>
          </nav>
        ) : null}

        {isPawjai && mainTab === "shelters" ? (
          <PartnerSheltersTab
            bookings={selectedShelterBookings}
            dogs={selectedShelterDogs}
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
        {isPawjai && mainTab === "ads" ? <AdsTab ads={ads} /> : null}
        {isPawjai && mainTab === "about" ? <AboutTab about={about} /> : null}

        {!isPawjai ? (
          <ShelterWorkspace
            adminMode={false}
            bookingListHref={shelterWorkspaceBookingsHref}
            bookings={selectedShelterBookings}
            checkInHref={withReturnTo("/booking/check-in", shelterWorkspaceBookingsHref)}
            createDogHref={shelterWorkspaceCreateDogHref}
            dogEditHref={shelterWorkspaceDogEditHref}
            dogs={selectedShelterDogs}
            messageThreads={messageThreads}
            messagesUnavailable={messagesUnavailable}
            profileReturnTo={isShelterPortal ? `${workspaceBaseHref}?view=profile` : `/admindraft?shelter=${selectedShelter.id}&view=profile`}
            shelter={selectedShelter}
            tab={shelterTab}
            setTab={setShelterTab}
          />
        ) : null}

        <footer className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4 text-sm leading-6 text-[#74685d]">
          This draft is phrase-gated while we reorganize the admin hierarchy. Deep workflow links now keep PawJai admin and shelter portal users in their own lanes.
        </footer>
      </div>
    </main>
  );
}
