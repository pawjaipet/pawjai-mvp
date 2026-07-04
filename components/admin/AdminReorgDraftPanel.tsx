"use client";

import { useState } from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  ImageIcon,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
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
        <button className="rounded-full bg-[#d88c24] px-4 py-2 text-sm font-semibold text-white" type="button">
          Edit
        </button>
        <button className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]" type="button">
          Open
        </button>
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
  return (
    <Section eyebrow="Shelter profile" title={shelter.name}>
      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-[#eadfce] bg-[#fffdfa] p-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#eadfce] text-[#8d7f72]">
            {shelter.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`${shelter.name} logo`} className="h-full w-full object-cover" src={shelter.logoUrl} />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </div>
          <p className="mt-4 font-semibold text-[#4f4338]">Shelter logo</p>
          <p className="mt-1 text-sm leading-6 text-[#74685d]">{shelter.logoUrl ? "Connected from shelters.logo_url." : "No logo set yet."}</p>
        </div>
        <div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f8f0e5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Contact</p>
              <p className="mt-2 text-sm text-[#5b4d40]">{shelter.phoneNumber || "No phone set"}</p>
              <p className="mt-1 text-sm text-[#5b4d40]">{shelter.email || "No email set"}</p>
            </div>
            <div className="rounded-2xl bg-[#f8f0e5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Meeting address</p>
              <p className="mt-2 text-sm leading-6 text-[#5b4d40]">{shelter.address || shelter.location}</p>
            </div>
          </div>
          <FieldGrid fields={profileFields} />
          <button className="mt-5 rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white" type="button">
            Save shelter profile
          </button>
        </div>
      </div>
    </Section>
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
          <button
            className="rounded-full bg-[#d88c24] px-6 py-3 text-sm font-semibold text-white"
            onClick={() => setShowCreate((current) => !current)}
            type="button"
          >
            {showCreate ? "Hide create dog" : "Create dog profile"}
          </button>
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

function ShelterBookingsTab({ bookings }: { bookings: AdminDraftBooking[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((booking) => booking.appointmentDate === today).length;
  const checkedInCount = bookings.filter((booking) => booking.checkedIn).length;

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
            <button className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]" type="button">
              Open
            </button>
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
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d88c24] text-white" type="button">
              <MessageCircle className="h-4 w-4" />
            </button>
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
      {tab === "bookings" ? <ShelterBookingsTab bookings={bookings} /> : null}
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
      <ShelterBookingsTab bookings={filteredBookings} />
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
                <button className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]" type="button">
                  Edit dates
                </button>
                <button className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]" type="button">
                  {ad.isActive ? "Pause" : "Resume"}
                </button>
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
    </Section>
  );
}

export default function AdminReorgDraftPanel({ data }: { data?: AdminDraftData }) {
  const shelters = data?.shelters.length ? data.shelters : fallbackShelters;
  const dogs = data?.dogs.length ? data.dogs : fallbackDogs;
  const bookings = data?.bookings.length ? data.bookings : fallbackBookings;
  const ads = data?.ads ?? [];
  const about = data?.about ?? null;
  const [role, setRole] = useState<RoleView>("pawjai");
  const [mainTab, setMainTab] = useState<MainTab>("shelters");
  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id ?? "");
  const [shelterTab, setShelterTab] = useState<ShelterTab>("profile");

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
          No sign-in gate or protected route links in this draft. It is just the local structure before replacing the old admin page.
        </footer>
      </div>
    </main>
  );
}
