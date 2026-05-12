"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  initialDocumentSubmissionState,
  submitVerificationDocuments,
  type DocumentSubmissionState,
} from "@/app/documents/actions";
import {
  MAX_HOME_PHOTOS,
  syncVerificationFileFields,
} from "@/utils/adopter-documents";

const M = "Montserrat, sans-serif";

type Section = "A" | "B" | "C" | "D" | "done";
const SECTIONS: Exclude<Section, "done">[] = ["A", "B", "C", "D"];

const SECTION_META = {
  A: { label: "SECTION A: PERSONAL INFORMATION", title: "Personal Information", subtitle: "Please provide your personal details for verification purposes." },
  B: { label: "SECTION B: DOG OWNERSHIP EXPERIENCE", title: "Dog Ownership Experience", subtitle: "Tell us about your experience with dogs." },
  C: { label: "SECTION C: LIVING SITUATION", title: "Living Situation & Home Environment", subtitle: "Help us understand your living environment." },
  D: { label: "SECTION D: BONDING AND RESPONSIBILITY", title: "Bonding and Responsibility", subtitle: "Final section — your commitment to your future companion." },
} as const;

type DocumentsInitialData = {
  existingHomeFileNames: string[];
  existingIdFileName: string | null;
  form: {
    address: string;
    agreement: boolean;
    allergies: string;
    behaviorResponse: string;
    bondingPlan: string[];
    dateOfBirth: string;
    emergency: string;
    financialReady: string;
    fullName: string;
    hadPetsBefore: string;
    homeType: string;
    householdMembers: string;
    idNumber: string;
    occupation: string;
    otherPets: string[];
    ownRent: string;
    patienceAwareness: string;
    petExperience: string;
    phone: string;
    reason: string;
    rescueCareExp: string;
    timeAvailable: string;
    traumaResponse: string;
    travelPlan: string;
    yardSpace: string;
    landlordPermission: string;
  };
  verificationStatus: string;
};

function QuestionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[12px] text-[20px] font-bold leading-[1.25] text-[#65584f]" style={{ fontFamily: M }}>
      {children}
    </p>
  );
}

const inputCls =
  "w-full rounded-[14px] border-0 bg-white px-[18px] py-[16px] text-[15px] text-[#65584f] outline-none placeholder:text-[#65584f]/35";

function ChoiceBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[14px] px-[20px] py-[16px] text-left text-[15px] font-medium transition-all active:scale-[0.98] ${
        selected ? "text-white" : "bg-white text-[#65584f]"
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

function UploadBox({
  existingLabel,
  file,
  label,
  name,
  onChange,
}: {
  existingLabel?: string | null;
  file: File | null;
  label: string;
  name: string;
  onChange: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const currentLabel = file?.name ?? existingLabel ?? null;

  return (
    <div className="mb-[28px]">
      <QuestionLabel>{label}</QuestionLabel>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-[10px] rounded-[14px] bg-white py-[28px] transition-all active:scale-[0.98]"
        style={{ border: currentLabel ? "2px solid #cd8188" : "2px dashed rgba(101,88,79,0.2)" }}
      >
        {currentLabel ? (
          <>
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full" style={{ background: "#cd8188" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>{currentLabel}</p>
            <p className="text-[11px] text-[#65584f]/40" style={{ fontFamily: M }}>
              {file ? "Tap to replace" : "Already uploaded · tap to replace"}
            </p>
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
      <input
        ref={ref}
        name={name}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onChange(e.target.files[0]);
        }}
      />
    </div>
  );
}

function MultiUploadBox({
  existingLabels,
  files,
  label,
  max,
  name,
  onChange,
}: {
  existingLabels: string[];
  files: File[];
  label: string;
  max: number;
  name: string;
  onChange: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const totalSelected = files.length;
  const remaining = Math.max(0, max - totalSelected);

  function removeFile(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="mb-[28px]">
      <QuestionLabel>{label}</QuestionLabel>
      <p className="mb-[10px] text-[13px] text-[#65584f]/55" style={{ fontFamily: M }}>
        Up to {max} files · JPG, PNG, WEBP, or PDF
      </p>
      <div className="space-y-[10px]">
        {files.map((file, idx) => (
          <div
            key={`${file.name}-${idx}`}
            className="flex items-center justify-between gap-[12px] rounded-[14px] bg-white px-[18px] py-[14px]"
            style={{ border: "2px solid #cd8188" }}
          >
            <div className="flex items-center gap-[12px] min-w-0">
              <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full" style={{ background: "#cd8188" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="truncate text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>{file.name}</p>
            </div>
            <button
              type="button"
              onClick={() => removeFile(idx)}
              className="flex-shrink-0 rounded-full px-[10px] py-[4px] text-[11px] font-semibold"
              style={{ background: "rgba(101,88,79,0.1)", color: "#65584f", fontFamily: M }}
            >
              Remove
            </button>
          </div>
        ))}

        {files.length === 0 && existingLabels.length > 0 && (
          <div className="rounded-[14px] bg-white px-[18px] py-[12px]" style={{ border: "2px solid rgba(205,129,136,0.4)" }}>
            <p className="text-[11px] uppercase tracking-widest text-[#65584f]/45 mb-[4px]" style={{ fontFamily: M }}>
              Previously uploaded
            </p>
            {existingLabels.map((name) => (
              <p key={name} className="truncate text-[13px] text-[#65584f]" style={{ fontFamily: M }}>{name}</p>
            ))}
            <p className="mt-[6px] text-[11px] text-[#65584f]/45" style={{ fontFamily: M }}>Adding new files will replace these on submit.</p>
          </div>
        )}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-[8px] rounded-[14px] bg-white py-[24px] transition-all active:scale-[0.98]"
            style={{ border: "2px dashed rgba(101,88,79,0.2)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[13px] font-semibold text-[#65584f]/50" style={{ fontFamily: M }}>
              {files.length === 0
                ? existingLabels.length > 0
                  ? "Upload replacement files"
                  : "Click to upload files"
                : `Add more (${remaining} left)`}
            </p>
          </button>
        )}
      </div>
      <input
        ref={ref}
        name={name}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length === 0) return;
          const next = [...files, ...picked].slice(0, max);
          onChange(next);
          // Allow re-picking same file later
          if (ref.current) ref.current.value = "";
        }}
      />
    </div>
  );
}

function SectionWrapper({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={active ? "block" : "hidden"}>{children}</div>;
}

function statusCopy(status: string) {
  switch (status) {
    case "approved":
      return "Approved";
    case "submitted":
      return "Submitted";
    case "needs_updates":
      return "Needs updates";
    default:
      return "Not started";
  }
}

export default function DocumentsPageClient({ initialData }: { initialData: DocumentsInitialData }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [section, setSection] = useState<Section>("A");
  const [state, formAction, isPending] = useActionState<DocumentSubmissionState, FormData>(
    submitVerificationDocuments,
    initialDocumentSubmissionState,
  );
  const [isSubmittingFiles, startSubmitTransition] = useTransition();
  const [clientSubmitError, setClientSubmitError] = useState<string | null>(null);
  const [a, setA] = useState({
    address: initialData.form.address,
    dateOfBirth: initialData.form.dateOfBirth,
    fullName: initialData.form.fullName,
    idFile: null as File | null,
    idNumber: initialData.form.idNumber,
    occupation: initialData.form.occupation,
    phone: initialData.form.phone,
  });
  const [b, setB] = useState({
    hadPetsBefore: initialData.form.hadPetsBefore,
    petExperience: initialData.form.petExperience,
    reason: initialData.form.reason,
    rescueCareExp: initialData.form.rescueCareExp,
  });
  const [c, setC] = useState({
    allergies: initialData.form.allergies,
    homePhotos: [] as File[],
    homeType: initialData.form.homeType,
    householdMembers: initialData.form.householdMembers,
    landlordPermission: initialData.form.landlordPermission,
    otherPets: initialData.form.otherPets,
    ownRent: initialData.form.ownRent,
    travelPlan: initialData.form.travelPlan,
    yardSpace: initialData.form.yardSpace,
  });
  const [d, setD] = useState({
    agreement: initialData.form.agreement,
    behaviorResponse: initialData.form.behaviorResponse,
    bondingPlan: initialData.form.bondingPlan,
    emergency: initialData.form.emergency,
    financialReady: initialData.form.financialReady,
    patienceAwareness: initialData.form.patienceAwareness,
    timeAvailable: initialData.form.timeAvailable,
    traumaResponse: initialData.form.traumaResponse,
  });

  useEffect(() => {
    if (state.status === "success" && state.completed) {
      setSection("done");
    }
  }, [state.completed, state.status]);

  const sectionIdx = section === "done" ? 4 : SECTIONS.indexOf(section);
  const meta = section !== "done" ? SECTION_META[section] : null;
  const PREV: Record<Section, Section | null> = { A: null, B: "A", C: "B", D: "C", done: "D" };
  const NEXT: Record<Exclude<Section, "done">, Section> = { A: "B", B: "C", C: "D", D: "done" };

  const isSubmitting = isPending || isSubmittingFiles;
  const canContinue =
    section === "A" ? a.fullName.trim() !== "" :
    section === "B" ? b.hadPetsBefore !== "" :
    section === "C" ? c.homeType !== "" && c.ownRent !== "" :
    section === "D" ? d.agreement :
    false;

  function submitCurrentForm(saveMode: "draft" | "submit") {
    if (!formRef.current) {
      setClientSubmitError("The form is not ready yet. Please try again.");
      return;
    }

    setClientSubmitError(null);
    const formData = new FormData(formRef.current);
    formData.set("verificationSaveMode", saveMode);
    syncVerificationFileFields(formData, {
      homePhotos: c.homePhotos,
      idFile: a.idFile,
    });

    startSubmitTransition(() => {
      formAction(formData);
    });
  }

  function saveAndContinue(nextSection: Section) {
    submitCurrentForm("draft");
    setSection(nextSection);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        submitCurrentForm("submit");
      }}
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "100px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      <div className="px-[14px] pt-[14px] pb-[8px] flex items-center justify-between">
        <Link
          href="/"
          className="block h-[44px] w-[110px] active:scale-95 transition-transform"
          aria-label="PawJai home"
        >
          <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
        </Link>
        {section !== "done" && (
          <Link
            href="/profile"
            className="text-[12px] font-bold rounded-full px-[14px] py-[8px]"
            style={{ background: "#cd8188", color: "white", fontFamily: M }}
          >
            Save & Exit
          </Link>
        )}
      </div>

      {section !== "done" && (
        <div className="px-[20px] pb-[8px]">
          <div className="mb-[12px] rounded-[16px] bg-white px-[16px] py-[14px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#65584f]/45" style={{ fontFamily: M }}>
              Verification status
            </p>
            <p className="mt-[6px] text-[15px] font-semibold text-[#65584f]" style={{ fontFamily: M }}>
              {statusCopy(initialData.verificationStatus)}
            </p>
            <p className="mt-[4px] text-[12px] text-[#65584f]/60" style={{ fontFamily: M }}>
              Complete this once, then you can keep booking shelter visits without redoing the full document flow.
            </p>
          </div>
        </div>
      )}

      {section !== "done" && (
        <div className="flex items-center justify-center gap-[20px] py-[16px]">
          {SECTIONS.map((s, i) => {
            const active = i === sectionIdx;
            const done = i < sectionIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-[4px]">
                <div
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[13px] font-bold transition-all"
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
        {section !== "done" && meta && (
          <div className="mb-[20px] flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#65584f]/50" style={{ fontFamily: M }}>{meta.label}</p>
            <p className="text-[12px] font-bold text-[#cd8188]" style={{ fontFamily: M }}>{sectionIdx + 1}/4</p>
          </div>
        )}

        {(clientSubmitError || state.message) && section !== "done" && (
          <div className={`mb-[16px] rounded-[14px] px-[16px] py-[12px] text-[13px] ${clientSubmitError || state.status === "error" ? "bg-[#f6dadd] text-[#8f4d56]" : "bg-[#dcebd8] text-[#4d6b48]"}`} style={{ fontFamily: M }}>
            {clientSubmitError ?? state.message}
          </div>
        )}

        <SectionWrapper active={section === "A"}>
          <Block question="What is your full name?">
            <input name="fullName" type="text" className={inputCls} placeholder="Type here" value={a.fullName} onChange={(e) => setA({ ...a, fullName: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="What is your date of birth?">
            <input name="dateOfBirth" type="date" className={inputCls} value={a.dateOfBirth} onChange={(e) => setA({ ...a, dateOfBirth: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="What is your ID or passport number?">
            <input name="idNumber" type="text" className={inputCls} placeholder="Type here" value={a.idNumber} onChange={(e) => setA({ ...a, idNumber: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="What is your home address?">
            <textarea name="address" rows={3} className={`${inputCls} resize-none`} placeholder="Type here" value={a.address} onChange={(e) => setA({ ...a, address: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="What is your occupation?">
            <input name="occupation" type="text" className={inputCls} placeholder="Type here" value={a.occupation} onChange={(e) => setA({ ...a, occupation: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="What is your phone number?">
            <input name="phone" type="tel" className={inputCls} placeholder="Type here" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <UploadBox existingLabel={initialData.existingIdFileName} file={a.idFile} label="Upload your ID or passport" name="idFile" onChange={(f) => setA({ ...a, idFile: f })} />
        </SectionWrapper>

        <SectionWrapper active={section === "B"}>
          <input type="hidden" name="hadPetsBefore" value={b.hadPetsBefore} />
          <input type="hidden" name="rescueCareExp" value={b.rescueCareExp} />
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
          <Block question="Describe your experience with dogs">
            <textarea name="petExperience" rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={b.petExperience} onChange={(e) => setB({ ...b, petExperience: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="Why do you want to adopt a dog?">
            <textarea name="reason" rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} style={{ fontFamily: M }} />
          </Block>
        </SectionWrapper>

        <SectionWrapper active={section === "C"}>
          <input type="hidden" name="homeType" value={c.homeType} />
          <input type="hidden" name="ownRent" value={c.ownRent} />
          <input type="hidden" name="landlordPermission" value={c.landlordPermission} />
          <input type="hidden" name="otherPets" value={JSON.stringify(c.otherPets)} />
          <input type="hidden" name="travelPlan" value={c.travelPlan} />
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
            <input name="yardSpace" type="text" className={inputCls} placeholder="Type here" value={c.yardSpace} onChange={(e) => setC({ ...c, yardSpace: e.target.value })} style={{ fontFamily: M }} />
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
            <input name="householdMembers" type="number" min="1" className={inputCls} placeholder="Type here" value={c.householdMembers} onChange={(e) => setC({ ...c, householdMembers: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="Are there any allergies in the household?">
            <textarea name="allergies" rows={3} className={`${inputCls} resize-none`} placeholder="Type here" value={c.allergies} onChange={(e) => setC({ ...c, allergies: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <MultiUploadBox
            existingLabels={initialData.existingHomeFileNames}
            files={c.homePhotos}
            label="Upload clear photos of your home environment / pet designated areas"
            max={MAX_HOME_PHOTOS}
            name="homePhotos"
            onChange={(files) => setC({ ...c, homePhotos: files })}
          />
          <Block question="Are there other pets in your home?">
            <div className="space-y-[10px]">
              {["None", "Dog(s)", "Cat(s)", "Other animals"].map((opt) => {
                const selected = c.otherPets.includes(opt);
                return (
                  <ChoiceBtn
                    key={opt}
                    selected={selected}
                    onClick={() =>
                      setC({
                        ...c,
                        otherPets: selected ? c.otherPets.filter((x) => x !== opt) : [...c.otherPets, opt],
                      })
                    }
                  >
                    {opt}
                  </ChoiceBtn>
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
        </SectionWrapper>

        <SectionWrapper active={section === "D"}>
          <input type="hidden" name="bondingPlan" value={JSON.stringify(d.bondingPlan)} />
          <input type="hidden" name="financialReady" value={d.financialReady} />
          <input type="hidden" name="patienceAwareness" value={d.patienceAwareness} />
          <input type="hidden" name="behaviorResponse" value={d.behaviorResponse} />
          <input type="hidden" name="traumaResponse" value={d.traumaResponse} />
          <input type="hidden" name="agreementAccepted" value={String(d.agreement)} />
          <Block question="How do you plan to bond with your new dog?">
            <div className="space-y-[10px]">
              {["Regular walks and playtime", "Training and learning together", "Spending quality time at home"].map((opt) => {
                const selected = d.bondingPlan.includes(opt);
                return (
                  <ChoiceBtn
                    key={opt}
                    selected={selected}
                    onClick={() =>
                      setD({
                        ...d,
                        bondingPlan: selected ? d.bondingPlan.filter((x) => x !== opt) : [...d.bondingPlan, opt],
                      })
                    }
                  >
                    {opt}
                  </ChoiceBtn>
                );
              })}
            </div>
          </Block>
          <Block question="How much time can you dedicate to your dog daily?">
            <input name="timeAvailable" type="text" className={inputCls} placeholder="eg. 2–3 hours for walks and play" value={d.timeAvailable} onChange={(e) => setD({ ...d, timeAvailable: e.target.value })} style={{ fontFamily: M }} />
          </Block>
          <Block question="Are you financially prepared for pet ownership?">
            <div className="space-y-[10px]">
              {["Yes, fully prepared", "Yes, with some budget planning", "Need more information"].map((opt) => (
                <ChoiceBtn key={opt} selected={d.financialReady === opt} onClick={() => setD({ ...d, financialReady: opt })}>{opt}</ChoiceBtn>
              ))}
            </div>
          </Block>
          <Block question="What will you do if you can't care for the dog anymore?">
            <textarea name="emergency" rows={4} className={`${inputCls} resize-none`} placeholder="Type here" value={d.emergency} onChange={(e) => setD({ ...d, emergency: e.target.value })} style={{ fontFamily: M }} />
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
          <div className="mb-[28px]">
            <label className="flex cursor-pointer items-start gap-[14px] rounded-[14px] bg-white px-[18px] py-[16px]">
              <input
                type="checkbox"
                checked={d.agreement}
                onChange={(e) => setD({ ...d, agreement: e.target.checked })}
                className="mt-[2px] h-[20px] w-[20px] shrink-0 rounded accent-[#cd8188]"
              />
              <span className="text-[14px] leading-[1.6] text-[#65584f]/70" style={{ fontFamily: M }}>
                I understand that adopting a dog is a long-term commitment and I am ready to provide a loving, safe, and caring home for the rest of their life.
              </span>
            </label>
          </div>
        </SectionWrapper>

        {section === "done" && (
          <div className="flex flex-col items-center pb-[40px] pt-[40px] text-center">
            <div className="mb-[24px] flex h-[90px] w-[90px] items-center justify-center rounded-full" style={{ background: "#cd8188" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="mb-[12px] text-[28px] font-bold text-[#65584f]" style={{ fontFamily: M }}>Verification Saved!</p>
            <p className="mb-[12px] max-w-[280px] text-[14px] text-[#65584f]/60" style={{ fontFamily: M }}>
              {state.message ?? "Your verification details were saved successfully. You can update them later whenever something changes."}
            </p>
            <Link
              href="/appointments"
              className="block w-full rounded-full py-[15px] text-center text-[16px] font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              View Appointments
            </Link>
            <Link href="/dogs" className="mt-[14px] text-[14px] font-semibold text-[#65584f]/50" style={{ fontFamily: M }}>
              Back to browsing
            </Link>
          </div>
        )}
      </div>

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
          <button
            type="button"
            onClick={() => {
              const prev = PREV[section];
              if (prev) setSection(prev);
            }}
            disabled={!PREV[section] || isSubmitting}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] transition-all active:scale-95 disabled:opacity-25"
            style={{ border: "2px solid #65584f", background: "transparent", pointerEvents: "auto" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" />
            </svg>
          </button>
          {section === "D" ? (
            <button
              type="submit"
              disabled={!canContinue || isSubmitting}
              className="flex h-[52px] flex-1 items-center justify-center gap-[8px] rounded-[14px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: canContinue ? "#65584f" : "rgba(101,88,79,0.18)",
                color: canContinue ? "white" : "rgba(101,88,79,0.4)",
                pointerEvents: "auto",
                fontFamily: M,
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || isSubmitting}
              onClick={() => saveAndContinue(NEXT[section])}
              className="flex h-[52px] flex-1 items-center justify-center gap-[8px] rounded-[14px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: canContinue ? "#65584f" : "rgba(101,88,79,0.18)",
                color: canContinue ? "white" : "rgba(101,88,79,0.4)",
                pointerEvents: "auto",
                fontFamily: M,
              }}
            >
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </form>
  );
}
