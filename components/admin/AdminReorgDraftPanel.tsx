"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
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
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  createShelterBlockoutAction,
  deleteShelterAvailabilityAction,
  toggleShelterBlockoutDateAction,
  updateShelterOperatingDaysAction,
  updateShelterProfileAction,
} from "@/app/admin/bookings/actions";
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

const DRAFT_RETURN_TO = "/admindraft";
const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

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
  { appointmentDate: "2026-07-23", appointmentTime: "16:00", bookingCode: "APT-D5A8A", checkedIn: false, dogId: "won", dogName: "วอน", id: "booking-1", shelterId: "voice", shelterName: "The Voice Foundation", status: "confirmed" },
  { appointmentDate: "2026-07-30", appointmentTime: "11:00", bookingCode: "APT-86496", checkedIn: false, dogId: "tua-daang", dogName: "ตัวแดง (Tua Daang)", id: "booking-2", shelterId: "voice", shelterName: "The Voice Foundation", status: "requested" },
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

const coreListingFields = [
  "Dog name",
  "Shelter",
  "Breed",
  "Adoption status",
  "Gender",
  "Size",
  "Age in months",
  "Weight in kg",
  "My Story",
  "Medical needs shown on profile",
];

const matchingGroups = [
  { label: "How active is this dog?", values: ["Low", "Medium", "High"] },
  { label: "Protectiveness", values: ["Chill", "Alert barker", "Protective"] },
  { label: "Affection style", values: ["Cuddly", "Subtle", "Independent"] },
  { label: "Training status", values: ["Well-trained", "Still training", "Needs basics"] },
  { label: "People friendliness", values: ["Social", "Slow warm-up", "Owner-focused"] },
  { label: "Friendliness to other dogs", values: ["Friendly", "Selective", "Solo dog"] },
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

function matchesDogFilters(dog: AdminDraftDog, search: string, status: string) {
  const query = search.trim().toLowerCase();
  const searchable = [dog.name, dog.breed, dog.shelterName, dog.gender, dog.size, dog.energyLevel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (!query || searchable.includes(query)) && (status === "all" || dog.status === status);
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

function DraftReturnFields({ shelterId }: { shelterId: string }) {
  return (
    <>
      <input name="returnTo" type="hidden" value={DRAFT_RETURN_TO} />
      <input name="shelterId" type="hidden" value={shelterId} />
    </>
  );
}

function DogCard({ dog }: { dog: AdminDraftDog }) {
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
          href={`/admin/dogs/${dog.id}/edit`}
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

function CreateDogPreview() {
  return (
    <div className="mt-6 space-y-6">
      <Section eyebrow="Create dog profile" title="Core Listing">
        <p className="mt-2 text-sm leading-6 text-[#74685d]">
          This stays in the same format you already built: clear fields and clickable choice buttons.
        </p>
        <FieldGrid fields={coreListingFields} />
      </Section>

      <Section title="Matching Template">
        <div className="mt-5 space-y-5">
          {matchingGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">{group.label}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {group.values.map((value, index) => (
                  <button
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                      index === 0 ? "border-[#cd8188] bg-[#cd8188] text-white" : "border-[#eadfce] bg-white text-[#5b4d40]"
                    }`}
                    key={value}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Photos and videos">
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-[#9a6b2a]" />
              <p className="font-semibold text-[#4f4338]">Upload photos and videos</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#74685d]">
              Upload files, use photo URL slots, or pull from local `pawjaidogs` folders. Choose cover and display order.
            </p>
          </div>
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
            <p className="font-semibold text-[#4f4338]">Cover and display order</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Choose cover", "Move up", "Move down", "Add photo slot", "Remove slot"].map((action) => (
                <span className="rounded-full border border-[#d6c8ad] bg-white px-3 py-1.5 text-xs font-semibold text-[#65584f]" key={action}>
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ShelterProfileTab({ shelter }: { shelter: AdminDraftShelter }) {
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

          <form action={updateShelterProfileAction} className="grid gap-3" encType="multipart/form-data">
            <DraftReturnFields shelterId={shelter.id} />
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
              <DraftReturnFields shelterId={shelter.id} />
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
                      <DraftReturnFields shelterId={shelter.id} />
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
              <DraftReturnFields shelterId={shelter.id} />
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
                      <DraftReturnFields shelterId={shelter.id} />
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

function ShelterDogsTab({ dogs, shelter }: { dogs: AdminDraftDog[]; shelter: AdminDraftShelter }) {
  const [showCreate, setShowCreate] = useState(false);
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
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white"
              href={`/admin?shelter=${shelter.id}`}
            >
              Create dog profile
            </Link>
            <button
              className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40]"
              onClick={() => setShowCreate((current) => !current)}
              type="button"
            >
              {showCreate ? "Hide field map" : "Show field map"}
            </button>
          </div>
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
            <DogCard dog={dog} key={dog.id} />
          ))}
          {filteredDogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#74685d]">
              No dog listings match this view for {shelter.name}.
            </div>
          ) : null}
        </div>
      </Section>

      {showCreate ? <CreateDogPreview /> : null}
    </div>
  );
}

function ShelterBookingsTab({ bookings, shelterId }: { bookings: AdminDraftBooking[]; shelterId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((booking) => booking.appointmentDate === today).length;
  const checkedInCount = bookings.filter((booking) => booking.checkedIn).length;
  const liveBookingsHref = shelterId ? `/admin/bookings?shelter=${shelterId}&view=bookings` : "/admin/bookings";

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
      <div className="mt-5 flex flex-wrap gap-2">
        {bookingActions.map((action) => (
          <span className="rounded-full border border-[#d6c8ad] bg-white px-3 py-1.5 text-xs font-semibold text-[#65584f]" key={action}>
            {action}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          className="inline-flex rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white"
          href={liveBookingsHref}
        >
          Open live booking workspace
        </Link>
        <Link
          className="inline-flex rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40]"
          href="/admin/bookings/check-in"
        >
          Open QR check-in
        </Link>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#8d7f72]">Date</div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#8d7f72]">All statuses</div>
        <button className="rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white" type="button">
          Filter
        </button>
        <button className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40]" type="button">
          Reset
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {bookings.slice(0, 6).map((booking) => (
          <div className="grid gap-3 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 md:grid-cols-[1fr_1fr_1fr_auto]" key={booking.id}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Visit</p>
              <p className="mt-1 font-semibold text-[#4f4338]">{booking.appointmentDate}</p>
              <p className="text-sm text-[#74685d]">{booking.appointmentTime}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Dog</p>
              <p className="mt-1 font-semibold text-[#4f4338]">{booking.dogName}</p>
              <p className="text-sm text-[#74685d]">{booking.shelterName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Booking</p>
              <p className="mt-1 font-semibold text-[#4f4338]">{booking.bookingCode ?? booking.id.slice(0, 8)}</p>
              <p className="text-sm text-[#74685d]">{formatStatus(booking.status)}</p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
              href={`/admin/bookings/${booking.id}`}
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ShelterMessagesTab({ shelter }: { shelter: AdminDraftShelter }) {
  return (
    <Section eyebrow="Messaging" title="Visitor conversations">
      <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4">
          <p className="font-semibold text-[#4f4338]">{shelter.unreadMessageCount} recent message records</p>
          <p className="mt-2 text-sm text-[#74685d]">Message counts are connected. Full message body stays out of the public draft.</p>
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
          <div className="rounded-2xl bg-[#f8f0e5] px-4 py-3 text-sm text-[#5b4d40]">
            Hi, should I bring anything for the visit?
          </div>
          <div className="mt-4 flex gap-2">
            <div className="min-h-12 flex-1 rounded-full border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#8d7f72]">
              Write a shelter reply...
            </div>
            <Link
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d88c24] text-white"
              href={`/admin/bookings?shelter=${shelter.id}&view=messages`}
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ShelterWorkspace({
  adminMode,
  bookings,
  dogs,
  shelter,
  tab,
  setTab,
}: {
  adminMode: boolean;
  bookings: AdminDraftBooking[];
  dogs: AdminDraftDog[];
  shelter: AdminDraftShelter;
  tab: ShelterTab;
  setTab: (tab: ShelterTab) => void;
}) {
  return (
    <div className="space-y-6">
      <Section eyebrow={adminMode ? "Partner shelter workspace" : "My Shelter Workspace powered by PAWJAI"} title={shelter.name}>
        <div className={`mt-5 grid gap-3 ${adminMode ? "md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
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
      {tab === "profile" ? <ShelterProfileTab shelter={shelter} /> : null}
      {tab === "dogs" ? <ShelterDogsTab dogs={dogs} shelter={shelter} /> : null}
      {tab === "bookings" ? <ShelterBookingsTab bookings={bookings} shelterId={shelter.id} /> : null}
      {tab === "messages" ? <ShelterMessagesTab shelter={shelter} /> : null}
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
}: {
  bookings: AdminDraftBooking[];
  dogs: AdminDraftDog[];
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
          PawJai HQ lands here first instead of Create dog. Open a shelter to see its profile, dog listings, booking visits, and messaging.
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
        bookings={bookings}
        dogs={dogs}
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
          <DogCard dog={dog} key={dog.id} />
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
      <ShelterBookingsTab bookings={filteredBookings} shelterId={shelterId === "all" ? undefined : shelterId} />
    </Section>
  );
}

function AdsTab({ ads }: { ads: AdminDraftAd[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Section eyebrow="Ads" title="PawJai-managed ads">
      <p className="mt-2 text-sm leading-6 text-[#74685d]">
        This remains a PawJai admin page for onboarding ads internally. Brands do not need their own login yet. Connected ads: {ads.length}.
      </p>
      <FieldGrid fields={["Advertiser", "Placement", "Image/video asset", "Destination URL", "Live status", "Start date", "End date"]} />
      <div className="mt-6 grid gap-3">
        {ads.map((ad) => {
          const expired = ad.endDate < today;
          const label = expired ? "Expired" : ad.isActive ? "Live" : "Paused";

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
  data,
  initialShelterId,
  initialShelterTab,
}: {
  data?: AdminDraftData;
  initialShelterId?: string;
  initialShelterTab?: string;
}) {
  const shelters = data?.shelters.length ? data.shelters : fallbackShelters;
  const dogs = data?.dogs.length ? data.dogs : fallbackDogs;
  const bookings = data?.bookings.length ? data.bookings : fallbackBookings;
  const ads = data?.ads ?? [];
  const about = data?.about ?? null;
  const [role, setRole] = useState<RoleView>("pawjai");
  const [mainTab, setMainTab] = useState<MainTab>("shelters");
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
          <div className="flex flex-wrap gap-2">
            <PillButton active={role === "pawjai"} onClick={() => setRole("pawjai")}>View as PawJai</PillButton>
            <PillButton active={role === "shelter"} onClick={() => setRole("shelter")}>View as shelter</PillButton>
          </div>
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
          />
        ) : null}
        {isPawjai && mainTab === "dogs" ? <AllDogsTab dogs={dogs} shelters={shelters} /> : null}
        {isPawjai && mainTab === "bookings" ? <GlobalBookingsTab bookings={bookings} shelters={shelters} /> : null}
        {isPawjai && mainTab === "ads" ? <AdsTab ads={ads} /> : null}
        {isPawjai && mainTab === "about" ? <AboutTab about={about} /> : null}

        {!isPawjai ? (
          <ShelterWorkspace
            adminMode={false}
            bookings={selectedShelterBookings}
            dogs={selectedShelterDogs}
            shelter={selectedShelter}
            tab={shelterTab}
            setTab={setShelterTab}
          />
        ) : null}

        <footer className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4 text-sm leading-6 text-[#74685d]">
          This draft is phrase-gated while we reorganize the admin hierarchy. Live workflow links still use the existing PawJai admin pages.
        </footer>
      </div>
    </main>
  );
}
