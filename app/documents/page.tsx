"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import ClientAuthGate from "@/components/auth/ClientAuthGate";

const M = "Montserrat, sans-serif";

type Section = "A" | "B" | "C" | "D" | "done";
const SECTIONS: Exclude<Section, "done">[] = ["A", "B", "C", "D"];

const SECTION_META = {
  A: { label: "SECTION A: PERSONAL INFORMATION",        title: "Personal Information",               subtitle: "Please provide your personal details for verification purposes." },
  B: { label: "SECTION B: DOG OWNERSHIP EXPERIENCE",   title: "Dog Ownership Experience",            subtitle: "Tell us about your experience with dogs." },
  C: { label: "SECTION C: LIVING SITUATION",            title: "Living Situation & Home Environment", subtitle: "Help us understand your living environment." },
  D: { label: "SECTION D: BONDING AND RESPONSIBILITY",  title: "Bonding and Responsibility",          subtitle: "Final section — your commitment to your future companion." },
} as const;

// ─── Primitive components ────────────────────────────────────────────────────

function QuestionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-bold text-[20px] leading-[1.25] text-[#65584f] mb-[12px]" style={{ fontFamily: M }}>
      {children}
    </p>
  );
}

const inputCls =
  "w-full bg-white px-[18px] py-[16px] rounded-[14px] text-[15px] text-[#65584f] outline-none border-0 placeholder:text-[#65584f]/35";

function ChoiceBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-[20px] py-[16px] rounded-[14px] text-left text-[15px] font-medium transition-all active:scale-[0.98] ${
        selected ? "text-white" : "text-[#65584f] bg-white"
      }`}
      style={{ background: selected ? "#cd8188" : "white", fontFamily: M }}
    >
      {children}
    </button>
  );
}

function Block({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="mb-[28px]">
      <QuestionLabel>{question}</QuestionLabel>
      {children}
    </div>
  );
}

function UploadBox({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-[28px]">
      <QuestionLabel>{label}</QuestionLabel>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full rounded-[14px] flex flex-col items-center justify-center gap-[10px] py-[28px] transition-all active:scale-[0.98] bg-white"
        style={{ border: file ? "2px solid #cd8188" : "2px dashed rgba(101,88,79,0.2)" }}
      >
        {file ? (
          <>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center" style={{ background: "#cd8188" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>{file.name}</p>
            <p className="text-[11px] text-[#65584f]/40" style={{ fontFamily: M }}>Tap to replace</p>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[13px] font-semibold text-[#65584f]/50" style={{ fontFamily: M }}>Click to upload · JPG, PNG or PDF</p>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
    </div>
  );
}

// ─── State types ─────────────────────────────────────────────────────────────
type StateA = { fullName: string; dateOfBirth: string; idNumber: string; address: string; occupation: string; phone: string; idFile: File | null };
type StateB = { hadPetsBefore: string; rescueCareExp: string; currentPets: string; petExperience: string; reason: string };
type StateC = { homeType: string; ownRent: string; yardSpace: string; landlordPermission: string; householdMembers: string; allergies: string; homePhotos: File | null; otherPets: string[]; travelPlan: string };
type StateD = { bondingPlan: string[]; timeAvailable: string; financialReady: string; emergency: string; patienceAwareness: string; behaviorResponse: string; traumaResponse: string; agreement: boolean };

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [section, setSection] = useState<Section>("A");
  const [a, setA] = useState<StateA>({ fullName: "", dateOfBirth: "", idNumber: "", address: "", occupation: "", phone: "", idFile: null });
  const [b, setB] = useState<StateB>({ hadPetsBefore: "", rescueCareExp: "", currentPets: "", petExperience: "", reason: "" });
  const [c, setC] = useState<StateC>({ homeType: "", ownRent: "", yardSpace: "", landlordPermission: "", householdMembers: "", allergies: "", homePhotos: null, otherPets: [], travelPlan: "" });
  const [d, setD] = useState<StateD>({ bondingPlan: [], timeAvailable: "", financialReady: "", emergency: "", patienceAwareness: "", behaviorResponse: "", traumaResponse: "", agreement: false });

  const sectionIdx = section === "done" ? 4 : SECTIONS.indexOf(section as Exclude<Section, "done">);
  const meta = section !== "done" ? SECTION_META[section as Exclude<Section, "done">] : null;

  const PREV: Record<Section, Section | null> = { A: null, B: "A", C: "B", D: "C", done: "D" };
  const NEXT: Record<Exclude<Section, "done">, Section> = { A: "B", B: "C", C: "D", D: "done" };

  const canContinue =
    section === "A" ? a.fullName.trim() !== "" :
    section === "B" ? b.hadPetsBefore !== "" :
    section === "C" ? c.homeType !== "" && c.ownRent !== "" :
    section === "D" ? d.agreement :
    false;

  return (
    <ClientAuthGate nextPath="/documents" reason="Sign in to upload and manage adoption documents.">
      <div
        className="relative overflow-y-auto overflow-x-hidden"
        style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "100px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* ── Top bar ── */}
        <div className="px-[16px] pt-[20px] pb-[8px]">
          {section !== "done" ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-[8px] px-[16px] py-[10px] rounded-full text-[13px] font-semibold text-white"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
              </svg>
              Save and Back to Profile
            </Link>
          ) : (
            <div className="h-[40px]" />
          )}
        </div>

        {/* ── Section dots ── */}
        {section !== "done" && (
          <div className="flex items-center justify-center gap-[20px] py-[16px]">
            {SECTIONS.map((s, i) => {
              const active = i === sectionIdx;
              const done = i < sectionIdx;
              return (
                <div key={s} className="flex flex-col items-center gap-[4px]">
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-bold transition-all"
                    style={{
                      background: active ? "#cd8188" : done ? "rgba(205,129,136,0.25)" : "rgba(101,88,79,0.12)",
                      color: active ? "white" : done ? "#cd8188" : "rgba(101,88,79,0.4)",
                      border: done ? "2px solid rgba(205,129,136,0.4)" : "2px solid transparent",
                    }}
                  >
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cd8188" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : s}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-[20px]">
          {/* ── Section header ── */}
          {section !== "done" && meta && (
            <div className="flex items-center justify-between mb-[20px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#65584f]/50" style={{ fontFamily: M }}>{meta.label}</p>
              <p className="text-[12px] font-bold text-[#cd8188]" style={{ fontFamily: M }}>{sectionIdx + 1}/4</p>
            </div>
          )}

          {/* ══ SECTION A ══ */}
          {section === "A" && (
            <>
              <Block question="What is your full name?">
                <input type="text" className={inputCls} placeholder="Type here" value={a.fullName} onChange={(e) => setA({ ...a, fullName: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="What is your date of birth?">
                <input type="date" className={inputCls} value={a.dateOfBirth} onChange={(e) => setA({ ...a, dateOfBirth: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="What is your ID or passport number?">
                <input type="text" className={inputCls} placeholder="Type here" value={a.idNumber} onChange={(e) => setA({ ...a, idNumber: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="What is your home address?">
                <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Type here" value={a.address} onChange={(e) => setA({ ...a, address: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="What is your occupation?">
                <input type="text" className={inputCls} placeholder="Type here" value={a.occupation} onChange={(e) => setA({ ...a, occupation: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="What is your phone number?">
                <input type="tel" className={inputCls} placeholder="Type here" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <UploadBox label="Upload your ID or passport" file={a.idFile} onChange={(f) => setA({ ...a, idFile: f })} />
            </>
          )}

          {/* ══ SECTION B ══ */}
          {section === "B" && (
            <>
              <Block question="Have you owned a dog before?">
                <div className="space-y-[10px]">
                  {["Yes", "No"].map((opt) => (
                    <ChoiceBtn key={opt} selected={b.hadPetsBefore === opt} onClick={() => setB({ ...b, hadPetsBefore: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="Have you ever cared for a rescue or stray dog before?">
                <div className="space-y-[10px]">
                  {["Yes", "No", "I have volunteered at a shelter"].map((opt) => (
                    <ChoiceBtn key={opt} selected={b.rescueCareExp === opt} onClick={() => setB({ ...b, rescueCareExp: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="Do you currently have any pets?">
                <input type="text" className={inputCls} placeholder="Type here" value={b.currentPets} onChange={(e) => setB({ ...b, currentPets: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="Describe your experience with dogs">
                <textarea rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={b.petExperience} onChange={(e) => setB({ ...b, petExperience: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="Why do you want to adopt a dog?">
                <textarea rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} style={{ fontFamily: M }} />
              </Block>
            </>
          )}

          {/* ══ SECTION C ══ */}
          {section === "C" && (
            <>
              <Block question="What type of home do you live in?">
                <div className="space-y-[10px]">
                  {["Apartment", "House", "Condo", "Other"].map((opt) => (
                    <ChoiceBtn key={opt} selected={c.homeType === opt} onClick={() => setC({ ...c, homeType: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="Do you own or rent?">
                <div className="space-y-[10px]">
                  {["Own", "Rent"].map((opt) => (
                    <ChoiceBtn key={opt} selected={c.ownRent === opt} onClick={() => setC({ ...c, ownRent: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="Do you have yard or outdoor space?">
                <input type="text" className={inputCls} placeholder="Type here" value={c.yardSpace} onChange={(e) => setC({ ...c, yardSpace: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              {c.ownRent === "Rent" && (
                <Block question="Do you have landlord permission for pets?">
                  <div className="space-y-[10px]">
                    {["Yes", "No", "Need to confirm"].map((opt) => (
                      <ChoiceBtn key={opt} selected={c.landlordPermission === opt} onClick={() => setC({ ...c, landlordPermission: opt })}>{opt}</ChoiceBtn>
                    ))}
                  </div>
                </Block>
              )}
              <Block question="How many people live in your household?">
                <input type="number" min="1" className={inputCls} placeholder="Type here" value={c.householdMembers} onChange={(e) => setC({ ...c, householdMembers: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="Are there any allergies in the household?">
                <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Type here" value={c.allergies} onChange={(e) => setC({ ...c, allergies: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <UploadBox label="Upload clear photos of your home environment / pet designated areas" file={c.homePhotos} onChange={(f) => setC({ ...c, homePhotos: f })} />
              <Block question="Are there other pets in your home?">
                <div className="space-y-[10px]">
                  {["None", "Dog(s)", "Cat(s)", "Other animals"].map((opt) => {
                    const selected = c.otherPets.includes(opt);
                    return (
                      <ChoiceBtn key={opt} selected={selected} onClick={() => {
                        setC({ ...c, otherPets: selected ? c.otherPets.filter((x) => x !== opt) : [...c.otherPets, opt] });
                      }}>{opt}</ChoiceBtn>
                    );
                  })}
                </div>
              </Block>
              <Block question="What will happen to your dog when you travel?">
                <div className="space-y-[10px]">
                  {["I'll take them with me", "I have family / sitter support", "Pet hotel"].map((opt) => (
                    <ChoiceBtn key={opt} selected={c.travelPlan === opt} onClick={() => setC({ ...c, travelPlan: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
            </>
          )}

          {/* ══ SECTION D ══ */}
          {section === "D" && (
            <>
              <Block question="How do you plan to bond with your new dog?">
                <div className="space-y-[10px]">
                  {["Regular walks and playtime", "Training and learning together", "Spending quality time at home"].map((opt) => {
                    const selected = d.bondingPlan.includes(opt);
                    return (
                      <ChoiceBtn key={opt} selected={selected} onClick={() => {
                        setD({ ...d, bondingPlan: selected ? d.bondingPlan.filter((x) => x !== opt) : [...d.bondingPlan, opt] });
                      }}>{opt}</ChoiceBtn>
                    );
                  })}
                </div>
              </Block>
              <Block question="How much time can you dedicate to your dog daily?">
                <input type="text" className={inputCls} placeholder="eg. 2–3 hours for walks and play" value={d.timeAvailable} onChange={(e) => setD({ ...d, timeAvailable: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="Are you financially prepared for pet ownership?">
                <div className="space-y-[10px]">
                  {["Yes, fully prepared", "Yes, with some budget planning", "Need more information"].map((opt) => (
                    <ChoiceBtn key={opt} selected={d.financialReady === opt} onClick={() => setD({ ...d, financialReady: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="What will you do if you can't care for the dog anymore?">
                <textarea rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={d.emergency} onChange={(e) => setD({ ...d, emergency: e.target.value })} style={{ fontFamily: M }} />
              </Block>
              <Block question="Do you understand that some shelter dogs may need weeks or months to fully trust you and adjust?">
                <div className="space-y-[10px]">
                  {[
                    "Yes, I'm ready to be patient",
                    "I understand, but I hope it doesn't take long",
                    "I need more information",
                    "I'm not sure",
                  ].map((opt) => (
                    <ChoiceBtn key={opt} selected={d.patienceAwareness === opt} onClick={() => setD({ ...d, patienceAwareness: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="If your adopted dog chews shoes, furniture, or barks too much, how would you respond?">
                <div className="space-y-[10px]">
                  {[
                    "Use positive training and redirect behavior",
                    "Give them more toys and attention",
                    "Seek professional trainer help",
                    "I don't know yet",
                  ].map((opt) => (
                    <ChoiceBtn key={opt} selected={d.behaviorResponse === opt} onClick={() => setD({ ...d, behaviorResponse: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              <Block question="If the dog shows trauma-related behavior (fear, anxiety, aggression), how would you handle it?">
                <div className="space-y-[10px]">
                  {[
                    "Work with a behaviorist or trainer",
                    "Give them time and space to heal",
                    "Learn about trauma recovery in dogs",
                    "Seek advice from the shelter",
                    "Be patient and consistent",
                    "I'm not prepared for this",
                  ].map((opt) => (
                    <ChoiceBtn key={opt} selected={d.traumaResponse === opt} onClick={() => setD({ ...d, traumaResponse: opt })}>{opt}</ChoiceBtn>
                  ))}
                </div>
              </Block>
              {/* Agreement */}
              <div className="mb-[28px]">
                <label className="flex items-start gap-[14px] cursor-pointer bg-white rounded-[14px] px-[18px] py-[16px]">
                  <input
                    type="checkbox"
                    checked={d.agreement}
                    onChange={(e) => setD({ ...d, agreement: e.target.checked })}
                    className="mt-[2px] shrink-0 w-[20px] h-[20px] rounded accent-[#cd8188]"
                  />
                  <span className="text-[14px] text-[#65584f]/70 leading-[1.6]" style={{ fontFamily: M }}>
                    I understand that adopting a dog is a long-term commitment and I am ready to provide a loving, safe, and caring home for the rest of their life.
                  </span>
                </label>
              </div>
            </>
          )}

          {/* ══ DONE ══ */}
          {section === "done" && (
            <div className="flex flex-col items-center text-center pt-[40px] pb-[40px]">
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-[24px]" style={{ background: "#cd8188" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="font-bold text-[28px] text-[#65584f] mb-[12px]" style={{ fontFamily: M }}>Verification Complete!</p>
              <p className="text-[14px] text-[#65584f]/60 mb-[36px] max-w-[280px]" style={{ fontFamily: M }}>
                Your documents have been submitted successfully. We'll review them and get back to you soon.
              </p>
              <Link
                href="/appointments"
                className="w-full rounded-full py-[15px] text-white font-bold text-[16px] text-center block transition-all active:scale-[0.98]"
                style={{ background: "#cd8188", fontFamily: M }}
              >
                View Appointments
              </Link>
              <Link href="/swipe" className="mt-[14px] text-[14px] font-semibold text-[#65584f]/50" style={{ fontFamily: M }}>
                Back to browsing
              </Link>
            </div>
          )}
        </div>

        {/* ── Bottom nav buttons ── */}
        {section !== "done" && (
          <div
            className="fixed bottom-[70px] flex items-center gap-[12px] px-[20px] pb-[16px] pt-[24px]"
            style={{
              width: "402px",
              maxWidth: "100vw",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(to top, #F5F1E8 60%, rgba(245,241,232,0) 100%)",
              pointerEvents: "none",
            }}
          >
            {/* Back */}
            <button
              type="button"
              onClick={() => {
                const prev = PREV[section];
                if (prev) setSection(prev);
              }}
              disabled={!PREV[section]}
              className="shrink-0 w-[52px] h-[52px] rounded-[14px] flex items-center justify-center transition-all active:scale-95 disabled:opacity-25"
              style={{ border: "2px solid #65584f", background: "transparent", pointerEvents: "auto" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
              </svg>
            </button>
            {/* Continue / Submit */}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setSection(NEXT[section as Exclude<Section, "done">])}
              className="flex-1 h-[52px] rounded-[14px] flex items-center justify-center gap-[8px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: canContinue ? "#65584f" : "rgba(101,88,79,0.18)",
                color: canContinue ? "white" : "rgba(101,88,79,0.4)",
                pointerEvents: "auto",
                fontFamily: M,
              }}
            >
              {section === "D" ? "Submit" : "Continue"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </ClientAuthGate>
  );
}
