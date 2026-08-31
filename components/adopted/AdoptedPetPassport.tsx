"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Home,
  MessageCircle,
  PawPrint,
  Pill,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import MachineTranslatedText from "@/components/i18n/MachineTranslatedText";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";
const BG = "#F5F1E8";
const PINK = "#cd8188";
const BROWN = "#65584f";
const TAN = "#e6dcc4";

export type AdoptedPetPassportData = {
  adoptionDate: string | null;
  ageMonths: number | null;
  allergies: string | null;
  breed: string | null;
  careTimeline: Array<{
    createdAt: string;
    description: string | null;
    eventDate: string | null;
    eventType: string;
    id: string;
    title: string;
  }>;
  coverUrl: string | null;
  documents: Array<{
    documentType: string;
    fileUrl: string | null;
    id: string;
    storagePath: string | null;
    title: string;
    uploadedAt: string;
  }>;
  gender: string;
  id: string;
  lastUpdatedAt: string | null;
  lastVetCheckDate: string | null;
  medicalNotes: string | null;
  medicalTags: string[];
  medications: string | null;
  messageHref: string | null;
  name: string;
  nextVetCheckDueDate: string | null;
  personalityTags: string[];
  shelter: {
    district: string | null;
    id: string;
    logoUrl: string | null;
    name: string;
    province: string | null;
  } | null;
  size: string | null;
  specialNeedsNotes: string | null;
  specialNeeds: string | null;
  sterilized: boolean;
  vaccinationStatus: "unknown" | "not_started" | "partial" | "up_to_date" | "overdue";
  vaccinations: Array<{
    administeredOn: string | null;
    dueOn: string | null;
    id: string;
    notes: string | null;
    providerName: string | null;
    updatedAt: string;
    vaccineName: string;
    verificationStatus: "verified" | "pending" | "unknown";
  }>;
  weightKg: number | null;
};

function ageLabel(months: number | null): string {
  if (months === null) return "Not recorded yet";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years} yr ${remainingMonths} mo` : `${years} yr`;
}

function formatDate(value: string | null, locale: "en" | "th") {
  if (!value) return "Not recorded yet";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function cleanValue(value: string | null | undefined) {
  return value?.replace(/_/g, " ").trim() || "Not recorded yet";
}

function displayDocumentType(value: string) {
  return cleanValue(value).replace("proof", "proof").replace("record", "record");
}

function isOverdue(value: string | null) {
  if (!value) return false;
  const due = new Date(`${value}T00:00:00`).getTime();
  return !Number.isNaN(due) && due < Date.now();
}

function isDueSoon(value: string | null) {
  if (!value || isOverdue(value)) return false;
  const due = new Date(`${value}T00:00:00`).getTime();
  return !Number.isNaN(due) && due - Date.now() <= 1000 * 60 * 60 * 24 * 30;
}

function careStatusTone(status: string, dueDate?: string | null) {
  if (isOverdue(dueDate ?? null) || status === "overdue") {
    return { bg: "rgba(179,86,94,0.13)", color: "#9b3e48", label: "Overdue" };
  }
  if (isDueSoon(dueDate ?? null) || status === "pending" || status === "partial") {
    return { bg: "rgba(217,164,77,0.16)", color: "#9a6b2a", label: status === "partial" ? "Partial" : "Due soon" };
  }
  if (status === "verified" || status === "up_to_date") {
    return { bg: "rgba(68,139,85,0.13)", color: "#3f7d34", label: status === "verified" ? "Verified" : "Up to date" };
  }
  return { bg: "rgba(78,122,174,0.12)", color: "#3f6598", label: "Info" };
}

function CareStatusChip({ dueDate, status }: { dueDate?: string | null; status: string }) {
  const tone = careStatusTone(status, dueDate);
  return (
    <span
      className="shrink-0 rounded-full px-[10px] py-[5px] text-[11px] font-extrabold"
      style={{ background: tone.bg, color: tone.color, fontFamily: M }}
    >
      <MachineTranslatedText text={tone.label} />
    </span>
  );
}

function Section({
  children,
  icon,
  kicker,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  kicker?: string;
  title: string;
}) {
  return (
    <section
      className="rounded-[24px] p-[18px]"
      style={{ background: "white", boxShadow: "0 10px 28px rgba(101,88,79,0.08)" }}
    >
      <div className="mb-[14px] flex items-start gap-[12px]">
        <div
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(205,129,136,0.13)", color: PINK }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          {kicker && (
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#65584f]/40"
              style={{ fontFamily: M }}
            >
              <MachineTranslatedText text={kicker} />
            </p>
          )}
          <h2 className="text-[20px] font-extrabold leading-tight text-[#65584f]" style={{ fontFamily: M }}>
            <MachineTranslatedText text={title} />
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatCard({ ignoreValue = false, label, value }: { ignoreValue?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-[18px] px-[15px] py-[14px]" style={{ background: TAN }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65584f]/50" style={{ fontFamily: M }}>
        <MachineTranslatedText text={label} />
      </p>
      <p
        data-i18n-ignore={ignoreValue ? true : undefined}
        className="mt-[5px] text-[17px] font-extrabold capitalize text-[#65584f]"
        style={{ fontFamily: M }}
      >
        {ignoreValue ? value : <MachineTranslatedText text={value} />}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-[24px] py-[64px] text-center">
      <div
        className="mb-[20px] flex h-[92px] w-[92px] items-center justify-center rounded-full"
        style={{ background: "rgba(205,129,136,0.14)" }}
      >
        <PawPrint size={42} stroke={PINK} strokeWidth={2.4} />
      </div>
      <p className="text-[20px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
        <MachineTranslatedText text="No adopted pets yet" />
      </p>
      <p className="mt-[8px] max-w-[304px] text-[14px] leading-[1.55] text-[#65584f]/60" style={{ fontFamily: M }}>
        <MachineTranslatedText text="Pets you complete an adoption with will show up here as a care passport for vet visits, records, and reminders." />
      </p>
      <Link
        href="/"
        className="mt-[24px] rounded-full px-[32px] py-[14px] text-[15px] font-bold text-white transition-transform active:scale-95"
        style={{ background: PINK, fontFamily: M, boxShadow: "0 10px 26px rgba(205,129,136,0.28)" }}
      >
        <MachineTranslatedText text="Find a companion" />
      </Link>
    </div>
  );
}

function PetSelector({
  activePetId,
  onSelect,
  pets,
}: {
  activePetId: string;
  onSelect: (petId: string) => void;
  pets: AdoptedPetPassportData[];
}) {
  if (pets.length < 2) return null;

  return (
    <div className="-mx-[16px] mb-[18px] overflow-x-auto px-[16px] pb-[4px]" style={{ scrollbarWidth: "none" }}>
      <div className="flex gap-[10px]">
        {pets.map((pet) => {
          const active = pet.id === activePetId;
          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => onSelect(pet.id)}
              className="flex min-w-[190px] items-center gap-[10px] rounded-[18px] p-[10px] text-left transition-transform active:scale-[0.98]"
              style={{
                background: active ? PINK : "white",
                boxShadow: active ? "0 10px 24px rgba(205,129,136,0.28)" : "0 8px 22px rgba(101,88,79,0.08)",
                color: active ? "white" : BROWN,
              }}
              aria-pressed={active}
            >
              <PetThumb pet={pet} size={48} active={active} />
              <span className="min-w-0">
                <span data-i18n-ignore className="block truncate text-[14px] font-extrabold" style={{ fontFamily: M }}>
                  {pet.name}
                </span>
                <span className={`block truncate text-[11px] font-semibold ${active ? "text-white/72" : "text-[#65584f]/55"}`} style={{ fontFamily: M }}>
                  <MachineTranslatedText text={pet.breed || "Breed not set"} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PetThumb({ active = false, pet, size }: { active?: boolean; pet: AdoptedPetPassportData; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
      style={{
        background: active ? "rgba(255,255,255,0.20)" : TAN,
        border: active ? "1px solid rgba(255,255,255,0.34)" : "1px solid rgba(214,200,173,0.85)",
        height: size,
        width: size,
      }}
    >
      {pet.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pet.coverUrl} alt={pet.name} className="h-full w-full object-cover" />
      ) : (
        <PawPrint size={Math.round(size * 0.46)} stroke={active ? "white" : PINK} strokeWidth={2.2} />
      )}
    </span>
  );
}

function TimelineItem({ active = false, detail, title }: { active?: boolean; detail: string; title: string }) {
  return (
    <div className="flex gap-[12px]">
      <div className="flex flex-col items-center">
        <div
          className="mt-[3px] h-[13px] w-[13px] rounded-full"
          style={{ background: active ? PINK : "rgba(101,88,79,0.20)" }}
        />
        <div className="mt-[4px] h-full min-h-[34px] w-px bg-[#d6c8ad]" />
      </div>
      <div className="pb-[16px]">
        <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text={title} />
        </p>
        <p className="mt-[3px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
          <MachineTranslatedText text={detail} />
        </p>
      </div>
    </div>
  );
}

function InsurancePlan({ label, price, recommended = false }: { label: string; price: string; recommended?: boolean }) {
  return (
    <div
      className="rounded-[18px] px-[13px] py-[12px]"
      style={{
        background: recommended ? "rgba(205,129,136,0.13)" : "#F5F1E8",
        border: recommended ? "1.5px solid rgba(205,129,136,0.34)" : "1px solid rgba(214,200,173,0.75)",
      }}
    >
      <div className="flex items-center justify-between gap-[8px]">
        <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text={label} />
        </p>
        {recommended && (
          <span className="rounded-full bg-white px-[8px] py-[3px] text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#cd8188]" style={{ fontFamily: M }}>
            <MachineTranslatedText text="Recommended" />
          </span>
        )}
      </div>
      <p className="mt-[5px] text-[13px] font-bold text-[#65584f]/68" style={{ fontFamily: M }}>
        {price}
      </p>
    </div>
  );
}

function DetailNote({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[18px] px-[14px] py-[13px]" style={{ background: "#F5F1E8" }}>
      <div className="flex items-center gap-[8px]">
        <span className="text-[#cd8188]">{icon}</span>
        <p className="text-[12px] font-extrabold text-[#cd8188]" style={{ fontFamily: M }}>
          <MachineTranslatedText text={title} />
        </p>
      </div>
      <MachineTranslatedText
        as="p"
        text={value?.trim() || "Not recorded yet"}
        className="mt-[7px] text-[13px] leading-[1.5] text-[#65584f]/70"
        style={{ fontFamily: M }}
      />
    </div>
  );
}

function VaccinationRows({
  records,
  locale,
}: {
  records: AdoptedPetPassportData["vaccinations"];
  locale: "en" | "th";
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-[18px] bg-[#F5F1E8] px-[14px] py-[14px]">
        <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="No vaccination records yet" />
        </p>
        <p className="mt-[4px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Ask the shelter to add vaccine history here so your vet has one clean view." />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      {records.map((record) => (
        <div key={record.id} className="rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                <MachineTranslatedText text={record.vaccineName} />
              </p>
              <p className="mt-[3px] text-[12px] text-[#65584f]/58" style={{ fontFamily: M }}>
                <MachineTranslatedText text="Given" />: {formatDate(record.administeredOn, locale)}
              </p>
              <p className="mt-[2px] text-[12px] text-[#65584f]/58" style={{ fontFamily: M }}>
                <MachineTranslatedText text="Next due" />: {formatDate(record.dueOn, locale)}
              </p>
            </div>
            <CareStatusChip dueDate={record.dueOn} status={record.verificationStatus} />
          </div>
          {(record.providerName || record.notes) && (
            <p className="mt-[8px] text-[12px] leading-[1.45] text-[#65584f]/62" style={{ fontFamily: M }}>
              <MachineTranslatedText text={[record.providerName, record.notes].filter(Boolean).join(" · ")} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentRows({ documents, locale }: { documents: AdoptedPetPassportData["documents"]; locale: "en" | "th" }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-[18px] bg-[#F5F1E8] px-[14px] py-[14px]">
        <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="No care documents yet" />
        </p>
        <p className="mt-[4px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Adoption forms, vaccine books, and medical files will appear here once uploaded." />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      {documents.map((document) => {
        const content = (
          <>
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-white text-[#cd8188]">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                <MachineTranslatedText text={document.title} />
              </p>
              <p className="mt-[3px] text-[12px] text-[#65584f]/58" style={{ fontFamily: M }}>
                <MachineTranslatedText text={displayDocumentType(document.documentType)} /> · {formatDate(document.uploadedAt.slice(0, 10), locale)}
              </p>
            </div>
          </>
        );

        if (document.fileUrl) {
          return (
            <a
              key={document.id}
              href={document.fileUrl}
              rel="noreferrer"
              target="_blank"
              className="flex items-center gap-[12px] rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px] active:scale-[0.99]"
            >
              {content}
              <ChevronRight size={18} stroke={PINK} strokeWidth={2.4} />
            </a>
          );
        }

        return (
          <div key={document.id} className="flex items-center gap-[12px] rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px]">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function ReminderRows({ pet, locale }: { pet: AdoptedPetPassportData; locale: "en" | "th" }) {
  const reminders = [
    pet.nextVetCheckDueDate
      ? { status: "pending", title: "Next vet check", detail: formatDate(pet.nextVetCheckDueDate, locale), dueDate: pet.nextVetCheckDueDate }
      : null,
    pet.vaccinations.find((record) => record.dueOn)
      ? {
          status: pet.vaccinationStatus,
          title: "Next vaccine due",
          detail: formatDate(pet.vaccinations.find((record) => record.dueOn)?.dueOn ?? null, locale),
          dueDate: pet.vaccinations.find((record) => record.dueOn)?.dueOn ?? null,
        }
      : null,
    pet.medications
      ? { status: "pending", title: "Medication reminder", detail: pet.medications, dueDate: null }
      : null,
  ].filter((item): item is { detail: string; dueDate: string | null; status: string; title: string } => Boolean(item));

  if (reminders.length === 0) {
    return (
      <div className="rounded-[18px] bg-[#F5F1E8] px-[14px] py-[14px]">
        <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="No reminders yet" />
        </p>
        <p className="mt-[4px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Vaccine dates, vet checks, and medication reminders will appear when the shelter adds them." />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      {reminders.map((reminder) => (
        <div key={reminder.title} className="flex items-center justify-between gap-[12px] rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px]">
          <div className="min-w-0">
            <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
              <MachineTranslatedText text={reminder.title} />
            </p>
            <p className="mt-[3px] text-[12px] leading-[1.4] text-[#65584f]/58" style={{ fontFamily: M }}>
              <MachineTranslatedText text={reminder.detail} />
            </p>
          </div>
          <CareStatusChip dueDate={reminder.dueDate} status={reminder.status} />
        </div>
      ))}
    </div>
  );
}

export default function AdoptedPetPassport({ pets }: { pets: AdoptedPetPassportData[] }) {
  const { language } = useLanguage();
  const [activePetId, setActivePetId] = useState(pets[0]?.id ?? "");
  const activePet = useMemo(
    () => pets.find((pet) => pet.id === activePetId) ?? pets[0] ?? null,
    [activePetId, pets],
  );

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{
        background: BG,
        fontFamily: M,
        margin: "0 auto",
        maxWidth: "100vw",
        minHeight: "100dvh",
        paddingBottom: "92px",
        scrollbarWidth: "none",
        width: "402px",
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      <header className="px-[16px] pb-[24px] pt-[14px]" style={{ background: "#d6c8ad" }}>
        <div className="mb-[18px] flex items-start justify-between">
          <Link href="/" className="relative block h-[60px] w-[106px] active:scale-95 transition-transform" aria-label="PawJai home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
          </Link>
          <LanguageSwitcher className="mt-[4px]" />
        </div>
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#65584f]/48" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Post-adoption care" />
        </p>
        <h1 className="mt-[4px] text-[34px] font-extrabold leading-[1.06] text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="My Adopted Pets" />
        </h1>
        <p className="mt-[6px] text-[14px] leading-[1.45] text-[#65584f]/70" style={{ fontFamily: M }}>
          <MachineTranslatedText text="A warm care passport for vet visits, records, reminders, and shelter origin." />
        </p>
      </header>

      {activePet ? (
        <main className="space-y-[16px] px-[16px] pt-[18px]">
          <PetSelector activePetId={activePet.id} onSelect={setActivePetId} pets={pets} />

          <section className="overflow-hidden rounded-[28px] bg-white" style={{ boxShadow: "0 14px 34px rgba(101,88,79,0.12)" }}>
            <div className="relative h-[250px] bg-[#d6c8ad]">
              {activePet.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activePet.coverUrl} alt={activePet.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PawPrint size={72} stroke={PINK} strokeWidth={2.1} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/62 to-transparent" />
              <div className="absolute left-[16px] top-[16px] rounded-full bg-[#cd8188] px-[13px] py-[7px] text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(205,129,136,0.34)]">
                <MachineTranslatedText text="Adopted" />
              </div>
              <div className="absolute bottom-[16px] left-[16px] right-[16px]">
                <h2 data-i18n-ignore className="text-[34px] font-extrabold leading-[1.02] text-white drop-shadow" style={{ fontFamily: M }}>
                  {activePet.name}
                </h2>
                <p className="mt-[5px] text-[15px] font-bold text-white/82" style={{ fontFamily: M }}>
                  <MachineTranslatedText text={activePet.breed || "Breed not set"} />
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[10px] p-[16px]">
              <StatCard label="Adoption date" value={formatDate(activePet.adoptionDate, language)} />
              <StatCard ignoreValue={Boolean(activePet.shelter?.name)} label="Shelter" value={activePet.shelter?.name ?? "Not recorded yet"} />
              <StatCard label="Last updated" value={formatDate(activePet.lastUpdatedAt?.slice(0, 10) ?? null, language)} />
              <StatCard label="Vet card" value="Ready to show" />
            </div>
          </section>

          <Section icon={<Stethoscope size={21} strokeWidth={2.3} />} kicker="Show Vet Card" title="Health snapshot">
            <div className="grid grid-cols-2 gap-[10px]">
              <StatCard label="Age" value={ageLabel(activePet.ageMonths)} />
              <StatCard label="Gender" value={cleanValue(activePet.gender)} />
              <StatCard label="Size" value={cleanValue(activePet.size)} />
              <StatCard label="Weight" value={activePet.weightKg ? `${activePet.weightKg} Kg` : "Not recorded yet"} />
              <StatCard label="Breed" value={activePet.breed || "Breed not set"} />
              <StatCard label="Sterilized" value={activePet.sterilized ? "Yes" : "No"} />
              <StatCard label="Vaccines" value={cleanValue(activePet.vaccinationStatus)} />
              <StatCard label="Last vet check" value={formatDate(activePet.lastVetCheckDate, language)} />
            </div>

            <div className="mt-[14px] grid gap-[10px]">
              <DetailNote
                icon={<HeartPulse size={17} strokeWidth={2.3} />}
                title="Medical notes"
                value={activePet.medicalNotes}
              />
              <DetailNote
                icon={<AlertTriangle size={17} strokeWidth={2.3} />}
                title="Special needs"
                value={activePet.specialNeedsNotes || activePet.specialNeeds || "None"}
              />
              <DetailNote
                icon={<Pill size={17} strokeWidth={2.3} />}
                title="Allergies / medication"
                value={[activePet.allergies, activePet.medications].filter(Boolean).join(" · ") || null}
              />
            </div>

            <div className="mt-[12px] flex flex-wrap gap-[8px]">
              {(activePet.medicalTags.length > 0 ? activePet.medicalTags : ["Not recorded yet"]).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-[13px] py-[7px] text-[12px] font-bold text-white"
                  style={{ background: BROWN, fontFamily: M }}
                >
                  <MachineTranslatedText text={tag} />
                </span>
              ))}
            </div>
          </Section>

          <Section icon={<Syringe size={21} strokeWidth={2.3} />} title="Vaccination & Documents">
            <p className="mb-[10px] text-[13px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
              <MachineTranslatedText text="Vaccination records" />
            </p>
            <VaccinationRows records={activePet.vaccinations} locale={language} />
            <p className="mb-[10px] mt-[16px] text-[13px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
              <MachineTranslatedText text="Care documents" />
            </p>
            <DocumentRows documents={activePet.documents} locale={language} />
          </Section>

          <Section icon={<HeartPulse size={21} strokeWidth={2.3} />} title="Insurance">
            <div className="mb-[12px] rounded-[18px] px-[14px] py-[13px]" style={{ background: "#F5F1E8" }}>
              <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                <MachineTranslatedText text="No insurance plan linked yet" />
              </p>
              <p className="mt-[4px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
                <MachineTranslatedText text="These care plans are placeholders until insurance checkout is connected." />
              </p>
            </div>
            <div className="space-y-[8px]">
              <InsurancePlan label="Starter" price="฿99/month" />
              <InsurancePlan label="Essential" price="฿199/month" recommended />
              <InsurancePlan label="Plus" price="฿399/month" />
            </div>
            <button
              type="button"
              className="mt-[13px] flex w-full items-center justify-center gap-[8px] rounded-full py-[13px] text-[14px] font-extrabold text-white"
              style={{ background: PINK, fontFamily: M, opacity: 0.84 }}
              disabled
            >
              <MachineTranslatedText text="Insurance coming soon" />
              <ChevronRight size={17} strokeWidth={2.4} />
            </button>
          </Section>

          <Section icon={<ClipboardList size={21} strokeWidth={2.3} />} title="Care Notes / Vet Notes">
            {activePet.careTimeline.length > 0 ? (
              activePet.careTimeline.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  active={index === 0}
                  title={event.title}
                  detail={[
                    cleanValue(event.eventType),
                    formatDate(event.eventDate ?? event.createdAt.slice(0, 10), language),
                    event.description,
                  ].filter(Boolean).join(" · ")}
                />
              ))
            ) : (
              <div className="rounded-[18px] bg-[#F5F1E8] px-[14px] py-[14px]">
                <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                  <MachineTranslatedText text="No care notes yet" />
                </p>
                <p className="mt-[4px] text-[12px] leading-[1.45] text-[#65584f]/58" style={{ fontFamily: M }}>
                  <MachineTranslatedText text="Shelter notes, vet updates, and care history will appear here." />
                </p>
              </div>
            )}
          </Section>

          <Section icon={<Bell size={21} strokeWidth={2.3} />} title="Reminders">
            <ReminderRows pet={activePet} locale={language} />
          </Section>

          <Section icon={<CalendarClock size={21} strokeWidth={2.3} />} title="Care Timeline">
            <TimelineItem
              active
              title="Adoption completed"
              detail={formatDate(activePet.adoptionDate, language)}
            />
            {activePet.lastVetCheckDate && (
              <TimelineItem title="Last vet check" detail={formatDate(activePet.lastVetCheckDate, language)} />
            )}
            {activePet.nextVetCheckDueDate && (
              <TimelineItem title="Next vet check" detail={formatDate(activePet.nextVetCheckDueDate, language)} />
            )}
          </Section>

          <Section icon={<Home size={21} strokeWidth={2.3} />} kicker="Shelter origin" title="Adopted from">
            <div className="flex items-center gap-[14px]">
              <div
                className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[18px]"
                style={{ background: "#F5F1E8", border: "1.5px solid #d6c8ad" }}
              >
                {activePet.shelter?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePet.shelter.logoUrl}
                    alt={`${activePet.shelter.name} logo`}
                    className="max-h-[58px] max-w-[58px] object-contain"
                  />
                ) : (
                  <ShieldCheck size={30} stroke={PINK} strokeWidth={2.1} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p data-i18n-ignore className="truncate text-[18px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                  {activePet.shelter?.name ?? "PawJai shelter"}
                </p>
                <p className="mt-[4px] text-[13px] text-[#65584f]/58" style={{ fontFamily: M }}>
                  <MachineTranslatedText text={[activePet.shelter?.district, activePet.shelter?.province].filter(Boolean).join(", ") || "Location not recorded yet"} />
                </p>
                <div className="mt-[7px] flex items-center gap-[5px]">
                  <BadgeCheck size={15} stroke={PINK} strokeWidth={2.3} />
                  <span className="text-[12px] font-bold text-[#cd8188]" style={{ fontFamily: M }}>
                    <MachineTranslatedText text="Verified Shelter" />
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {activePet.messageHref ? (
            <Link
              href={activePet.messageHref}
              className="flex items-center justify-center gap-[10px] rounded-full px-[24px] py-[15px] text-[15px] font-extrabold text-white active:scale-[0.98]"
              style={{ background: PINK, boxShadow: "0 12px 28px rgba(205,129,136,0.32)", fontFamily: M }}
            >
              <MessageCircle size={19} strokeWidth={2.4} />
              <MachineTranslatedText text="Message Shelter" />
            </Link>
          ) : null}
        </main>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
