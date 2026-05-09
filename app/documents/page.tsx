"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import ClientAuthGate from "@/components/auth/ClientAuthGate";

const M = "Montserrat, sans-serif";

type Section = "A" | "B" | "C" | "D" | "done";

const SECTION_META: Record<Exclude<Section, "done">, { label: string; title: string; subtitle: string; step: number }> = {
  A: { label: "Section A: Personal Information",     title: "Personal Information",             subtitle: "Please provide your personal details for verification purposes.", step: 1 },
  B: { label: "Section B: Dog Ownership Experience", title: "Dog Ownership Experience",          subtitle: "Tell us about your experience with dogs.", step: 2 },
  C: { label: "Section C: Living Situation",         title: "Living Situation & Home Environment", subtitle: "Help us understand your living environment.", step: 3 },
  D: { label: "Section D: Bonding and Responsibility", title: "Bonding and Responsibility",      subtitle: "Final section — your commitment to your future companion.", step: 4 },
};

// ── Shared primitives ───────────────────────────────────────────
const inputCls = "w-full px-[16px] py-[13px] rounded-[14px] border-2 border-[#d6c8ad] focus:border-[#cd8188] outline-none transition-colors text-[14px] text-[#65584f] bg-white placeholder:text-[#65584f]/40";
const textareaCls = `${inputCls} resize-none`;

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-[14px] rounded-[14px] border-2 transition-all text-left text-[14px] font-medium active:scale-[0.98] ${selected ? "border-[#cd8188] bg-[#cd8188]/10 text-[#65584f]" : "border-[#d6c8ad] bg-white text-[#65584f]/70 hover:border-[#cd8188]/40"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#65584f] mb-[8px]" style={{ fontFamily: M }}>{label}</label>
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[24px] p-[24px] shadow-sm mb-[20px]">
      <div className="space-y-[20px]">{children}</div>
    </div>
  );
}

function UploadBox({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field label={label}>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full rounded-[14px] flex flex-col items-center justify-center gap-[10px] py-[28px] transition-all active:scale-[0.98]"
        style={{ background: file ? "rgba(205,129,136,0.08)" : "#f5f1e8", border: file ? "2px solid #cd8188" : "2px dashed rgba(101,88,79,0.25)" }}
      >
        {file ? (
          <>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center" style={{ background: "#cd8188" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>{file.name}</p>
            <p className="text-[11px] text-[#65584f]/50" style={{ fontFamily: M }}>Tap to replace</p>
          </>
        ) : (
          <>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center" style={{ background: "rgba(101,88,79,0.1)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#65584f]" style={{ fontFamily: M }}>Click to upload</p>
            <p className="text-[11px] text-[#65584f]/50" style={{ fontFamily: M }}>JPG, PNG or PDF</p>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
    </Field>
  );
}

// ── State types ─────────────────────────────────────────────────
type StateA = { fullName: string; dateOfBirth: string; idNumber: string; address: string; occupation: string; phone: string; idFile: File | null };
type StateB = { hadPetsBefore: string; currentPets: string; petExperience: string; reason: string };
type StateC = { homeType: string; ownRent: string; yardSpace: string; landlordPermission: string; householdMembers: string; allergies: string };
type StateD = { commitment: string; timeAvailable: string; financialReady: string; emergency: string; agreement: boolean };

export default function DocumentsPage() {
  const [section, setSection] = useState<Section>("A");

  const [a, setA] = useState<StateA>({ fullName: "", dateOfBirth: "", idNumber: "", address: "", occupation: "", phone: "", idFile: null });
  const [b, setB] = useState<StateB>({ hadPetsBefore: "", currentPets: "", petExperience: "", reason: "" });
  const [c, setC] = useState<StateC>({ homeType: "", ownRent: "", yardSpace: "", landlordPermission: "", householdMembers: "", allergies: "" });
  const [d, setD] = useState<StateD>({ commitment: "", timeAvailable: "", financialReady: "", emergency: "", agreement: false });

  const meta = section !== "done" ? SECTION_META[section] : null;
  const progress = section === "done" ? 100 : (meta!.step / 4) * 100;

  const PREV: Record<Section, Section | null> = { A: null, B: "A", C: "B", D: "C", done: "D" };
  const NEXT: Record<Exclude<Section, "done">, Section> = { A: "B", B: "C", C: "D", D: "done" };

  return (
    <ClientAuthGate nextPath="/documents" reason="Sign in to upload and manage adoption documents.">
      <div
        className="relative overflow-y-auto overflow-x-hidden"
        style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* Gradient header */}
        <div
          className="fixed top-0 z-20 pointer-events-none h-[94px]"
          style={{ width: "402px", maxWidth: "100vw", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(to bottom, #d6c8ad 0%, rgba(214,200,173,0.75) 38.942%, rgba(214,200,173,0) 100%)" }}
        >
          <div className="pointer-events-auto absolute left-[8px] top-[39px]">
            <Link href="/swipe" className="block h-[55px] w-[110px] relative">
              <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
            </Link>
          </div>
        </div>

        <div className="pt-[106px] px-[16px]">

          {/* ── Section header ── */}
          {section !== "done" && meta && (
            <>
              {/* Progress row */}
              <div className="flex items-center justify-between mb-[8px]">
                <span className="text-[12px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>{meta.label}</span>
                <span className="text-[12px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>{meta.step} of 4</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-[6px] rounded-full mb-[20px]" style={{ background: "rgba(214,200,173,0.5)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#cd8188" }} />
              </div>
              {/* Title */}
              <div className="mb-[16px]">
                <h2 className="font-bold text-[22px] text-[#65584f]" style={{ fontFamily: M }}>{meta.title}</h2>
                <p className="text-[13px] text-[#65584f]/60 mt-[4px]" style={{ fontFamily: M }}>{meta.subtitle}</p>
              </div>
            </>
          )}

          {/* ── Section A: Personal Information ── */}
          {section === "A" && (
            <SectionCard>
              <Field label="Full Name">
                <input type="text" className={inputCls} placeholder="Enter your full name" value={a.fullName} onChange={(e) => setA({ ...a, fullName: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className={inputCls} value={a.dateOfBirth} onChange={(e) => setA({ ...a, dateOfBirth: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="ID / Passport Number">
                <input type="text" className={inputCls} placeholder="Enter your ID or passport number" value={a.idNumber} onChange={(e) => setA({ ...a, idNumber: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Address">
                <textarea rows={3} className={textareaCls} placeholder="Enter your full address" value={a.address} onChange={(e) => setA({ ...a, address: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Occupation">
                <input type="text" className={inputCls} placeholder="Enter your occupation" value={a.occupation} onChange={(e) => setA({ ...a, occupation: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Phone Number">
                <input type="tel" className={inputCls} placeholder="Enter your phone number" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <UploadBox label="Upload ID / Passport" file={a.idFile} onChange={(f) => setA({ ...a, idFile: f })} />
            </SectionCard>
          )}

          {/* ── Section B: Dog Ownership Experience ── */}
          {section === "B" && (
            <SectionCard>
              <Field label="Have you owned a dog before?">
                <div className="space-y-[8px]">
                  {["Yes", "No"].map((opt) => (
                    <ChoiceButton key={opt} selected={b.hadPetsBefore === opt} onClick={() => setB({ ...b, hadPetsBefore: opt })}>{opt}</ChoiceButton>
                  ))}
                </div>
              </Field>
              <Field label="Do you currently have any pets?">
                <input type="text" className={inputCls} placeholder="List any current pets" value={b.currentPets} onChange={(e) => setB({ ...b, currentPets: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Describe your experience with dogs">
                <textarea rows={4} className={textareaCls} placeholder="Share your experience with dogs..." value={b.petExperience} onChange={(e) => setB({ ...b, petExperience: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Why do you want to adopt a dog?">
                <textarea rows={4} className={textareaCls} placeholder="Tell us your motivation..." value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} style={{ fontFamily: M }} />
              </Field>
            </SectionCard>
          )}

          {/* ── Section C: Living Situation ── */}
          {section === "C" && (
            <SectionCard>
              <Field label="Type of Home">
                <div className="space-y-[8px]">
                  {["Apartment", "House", "Condo", "Other"].map((opt) => (
                    <ChoiceButton key={opt} selected={c.homeType === opt} onClick={() => setC({ ...c, homeType: opt })}>{opt}</ChoiceButton>
                  ))}
                </div>
              </Field>
              <Field label="Do you own or rent?">
                <div className="space-y-[8px]">
                  {["Own", "Rent"].map((opt) => (
                    <ChoiceButton key={opt} selected={c.ownRent === opt} onClick={() => setC({ ...c, ownRent: opt })}>{opt}</ChoiceButton>
                  ))}
                </div>
              </Field>
              <Field label="Do you have yard / outdoor space?">
                <input type="text" className={inputCls} placeholder="Describe your outdoor space" value={c.yardSpace} onChange={(e) => setC({ ...c, yardSpace: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              {c.ownRent === "Rent" && (
                <Field label="Do you have landlord permission for pets?">
                  <div className="space-y-[8px]">
                    {["Yes", "No", "Need to confirm"].map((opt) => (
                      <ChoiceButton key={opt} selected={c.landlordPermission === opt} onClick={() => setC({ ...c, landlordPermission: opt })}>{opt}</ChoiceButton>
                    ))}
                  </div>
                </Field>
              )}
              <Field label="Number of people in household">
                <input type="number" min="1" className={inputCls} placeholder="Number of people" value={c.householdMembers} onChange={(e) => setC({ ...c, householdMembers: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Any allergies in the household?">
                <textarea rows={3} className={textareaCls} placeholder="Describe any allergies..." value={c.allergies} onChange={(e) => setC({ ...c, allergies: e.target.value })} style={{ fontFamily: M }} />
              </Field>
            </SectionCard>
          )}

          {/* ── Section D: Bonding & Responsibility ── */}
          {section === "D" && (
            <SectionCard>
              <Field label="How do you plan to bond with your new dog?">
                <textarea rows={4} className={textareaCls} placeholder="Share your bonding plans..." value={d.commitment} onChange={(e) => setD({ ...d, commitment: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="How much time can you dedicate to your dog daily?">
                <input type="text" className={inputCls} placeholder="e.g., 2–3 hours for walks and play" value={d.timeAvailable} onChange={(e) => setD({ ...d, timeAvailable: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              <Field label="Are you financially prepared for pet ownership?">
                <div className="space-y-[8px]">
                  {["Yes, fully prepared", "Yes, with some budget planning", "Need more information"].map((opt) => (
                    <ChoiceButton key={opt} selected={d.financialReady === opt} onClick={() => setD({ ...d, financialReady: opt })}>{opt}</ChoiceButton>
                  ))}
                </div>
              </Field>
              <Field label="What will you do if you can't care for the dog anymore?">
                <textarea rows={4} className={textareaCls} placeholder="Your contingency plan..." value={d.emergency} onChange={(e) => setD({ ...d, emergency: e.target.value })} style={{ fontFamily: M }} />
              </Field>
              {/* Agreement */}
              <div className="pt-[4px] border-t border-[#d6c8ad]">
                <label className="flex items-start gap-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.agreement}
                    onChange={(e) => setD({ ...d, agreement: e.target.checked })}
                    className="mt-[2px] shrink-0 w-[20px] h-[20px] rounded accent-[#cd8188]"
                  />
                  <span className="text-[13px] text-[#65584f]/70 leading-[1.6]" style={{ fontFamily: M }}>
                    I understand that adopting a dog is a long-term commitment and I am ready to provide a loving, safe, and caring home for the rest of their life.
                  </span>
                </label>
              </div>
            </SectionCard>
          )}

          {/* ── Done ── */}
          {section === "done" && (
            <div className="flex flex-col items-center text-center pt-[20px] pb-[40px]">
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-[24px]" style={{ background: "#cd8188" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="font-bold text-[28px] text-[#65584f] mb-[12px]" style={{ fontFamily: M }}>Verification Complete!</p>
              <p className="text-[14px] text-[#65584f]/70 mb-[32px] max-w-[280px]" style={{ fontFamily: M }}>
                Your documents have been submitted successfully. We'll review them and get back to you soon.
              </p>
              <Link
                href="/appointments"
                className="w-full rounded-full py-[15px] text-white font-bold text-[16px] text-center block transition-all active:scale-[0.98]"
                style={{ background: "#cd8188", fontFamily: M }}
              >
                View Appointments
              </Link>
              <Link href="/swipe" className="mt-[14px] text-[14px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>
                Back to browsing
              </Link>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          {section !== "done" && (
            <div className="flex justify-between gap-[12px] mt-[4px]">
              {/* Back */}
              {PREV[section] ? (
                <button
                  type="button"
                  onClick={() => setSection(PREV[section]!)}
                  className="flex items-center gap-[8px] px-[20px] py-[13px] rounded-full text-[14px] font-semibold text-[#65584f] transition-all active:scale-[0.98]"
                  style={{ background: "#d6c8ad", fontFamily: M }}
                >
                  <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                    <path d="M5 1L1 6L5 11" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Previous
                </button>
              ) : <div />}
              {/* Next / Submit */}
              <button
                type="button"
                disabled={section === "D" && !d.agreement}
                onClick={() => setSection(NEXT[section])}
                className="flex items-center gap-[8px] px-[28px] py-[13px] rounded-full text-[14px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "#cd8188", fontFamily: M }}
              >
                {section === "D" ? "Submit" : "Next Section"}
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                  <path d="M1 1L5 6L1 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </div>
    </ClientAuthGate>
  );
}
