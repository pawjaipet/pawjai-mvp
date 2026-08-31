"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  FileText,
  HeartPulse,
  Home,
  PawPrint,
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
  breed: string | null;
  coverUrl: string | null;
  gender: string;
  id: string;
  medicalTags: string[];
  name: string;
  personalityTags: string[];
  shelter: {
    district: string | null;
    id: string;
    logoUrl: string | null;
    name: string;
    province: string | null;
  } | null;
  size: string | null;
  specialNeeds: string | null;
  sterilized: boolean;
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
            </div>

            <div className="mt-[14px] rounded-[18px] px-[15px] py-[14px]" style={{ background: "rgba(205,129,136,0.10)" }}>
              <p className="text-[12px] font-extrabold text-[#cd8188]" style={{ fontFamily: M }}>
                <MachineTranslatedText text="Special needs / medical notes" />
              </p>
              <MachineTranslatedText
                as="p"
                text={activePet.specialNeeds?.trim() || "None"}
                className="mt-[5px] text-[14px] leading-[1.55] text-[#65584f]/72"
                style={{ fontFamily: M }}
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
            <div className="space-y-[10px]">
              <div className="flex items-center justify-between gap-[14px] rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                    <MachineTranslatedText text="Vaccination history" />
                  </p>
                  <p className="mt-[3px] text-[12px] text-[#65584f]/58" style={{ fontFamily: M }}>
                    <MachineTranslatedText text="Not recorded yet" />
                  </p>
                </div>
                <span className="rounded-full bg-white px-[10px] py-[5px] text-[11px] font-bold text-[#cd8188]" style={{ fontFamily: M }}>
                  <MachineTranslatedText text="Coming soon" />
                </span>
              </div>
              <div className="flex items-center justify-between gap-[14px] rounded-[18px] bg-[#F5F1E8] px-[14px] py-[13px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-[#65584f]" style={{ fontFamily: M }}>
                    <MachineTranslatedText text="Adoption documents" />
                  </p>
                  <p className="mt-[3px] text-[12px] text-[#65584f]/58" style={{ fontFamily: M }}>
                    <MachineTranslatedText text="Documents coming soon" />
                  </p>
                </div>
                <FileText size={22} stroke={PINK} strokeWidth={2.2} />
              </div>
            </div>
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

          <Section icon={<CalendarClock size={21} strokeWidth={2.3} />} title="Care Timeline / Reminders">
            <TimelineItem
              active
              title="Adoption completed"
              detail={formatDate(activePet.adoptionDate, language)}
            />
            <TimelineItem
              title="First vet check reminder"
              detail="Not recorded yet"
            />
            <TimelineItem
              title="Vaccine reminder"
              detail="Coming soon"
            />
            <TimelineItem
              title="Insurance reminder"
              detail="Coming soon"
            />
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
        </main>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
