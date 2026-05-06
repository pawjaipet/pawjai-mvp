"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";

const M = "Montserrat, sans-serif";

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { id: 0, label: "Overview" },
  { id: 1, label: "National ID" },
  { id: 2, label: "Proof of Address" },
  { id: 3, label: "Submitted" },
] as const;

const REQUIRED_DOCS = [
  { icon: "🪪", title: "National ID Card", desc: "Thai national ID or passport (front & back)" },
  { icon: "🏠", title: "Proof of Address", desc: "Utility bill or bank statement (within 3 months)" },
  { icon: "📋", title: "Adoption Agreement", desc: "We'll send this once your documents are verified" },
];

function UploadBox({
  label,
  sublabel,
  file,
  onChange,
}: {
  label: string;
  sublabel: string;
  file: File | null;
  onChange: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-[12px] text-[#65584f]/60 mb-[8px] font-semibold uppercase tracking-wider" style={{ fontFamily: M }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full rounded-[16px] flex flex-col items-center justify-center gap-[10px] py-[36px] transition-all active:scale-[0.98]"
        style={{ background: file ? "rgba(205,129,136,0.08)" : "#d6c8ad", border: file ? "2px solid #cd8188" : "2px dashed rgba(101,88,79,0.3)" }}
      >
        {file ? (
          <>
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: "#cd8188" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[#cd8188]" style={{ fontFamily: M }}>{file.name}</p>
            <p className="text-[11px] text-[#65584f]/50" style={{ fontFamily: M }}>Tap to replace</p>
          </>
        ) : (
          <>
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: "rgba(101,88,79,0.1)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-[#65584f]" style={{ fontFamily: M }}>Upload photo or file</p>
            <p className="text-[12px] text-[#65584f]/50 text-center px-4" style={{ fontFamily: M }}>{sublabel}</p>
          </>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
    </div>
  );
}

export default function DocumentsPage() {
  const [step, setStep] = useState<Step>(0);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack]   = useState<File | null>(null);
  const [proof, setProof]     = useState<File | null>(null);

  const progress = (step / 3) * 100;

  return (
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

      <div className="pt-[100px] px-[16px]">
        {/* Title row */}
        <div className="flex items-center gap-[12px] mb-[6px]">
          {step > 0 && step < 3 && (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: "#d6c8ad" }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 className="font-bold text-[28px] text-[#65584f]" style={{ fontFamily: M }}>Your Documents</h1>
        </div>

        {/* Progress bar */}
        {step < 3 && (
          <div className="h-[6px] rounded-full mb-[24px]" style={{ background: "rgba(214,200,173,0.5)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#cd8188" }} />
          </div>
        )}

        {/* Step 0 — Overview */}
        {step === 0 && (
          <div className="space-y-[16px]">
            <p className="text-[14px] text-[#65584f]/70" style={{ fontFamily: M }}>
              To proceed with adoption, we need to verify your identity and residence. Please prepare the following documents.
            </p>
            <div className="space-y-[12px]">
              {REQUIRED_DOCS.map((doc) => (
                <div key={doc.title} className="rounded-[16px] p-[16px] flex items-start gap-[14px]" style={{ background: "white" }}>
                  <span className="text-[28px] shrink-0">{doc.icon}</span>
                  <div>
                    <p className="font-semibold text-[14px] text-[#65584f]" style={{ fontFamily: M }}>{doc.title}</p>
                    <p className="text-[12px] text-[#65584f]/60 mt-[2px]" style={{ fontFamily: M }}>{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-[14px] p-[14px] flex items-start gap-[10px]" style={{ background: "rgba(205,129,136,0.1)" }}>
              <span className="text-[18px] shrink-0">🔒</span>
              <p className="text-[12px] text-[#65584f]/70" style={{ fontFamily: M }}>
                Your documents are encrypted and shared only with the adoption shelter. We never sell your data.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-full py-[15px] text-white font-bold text-[16px] transition-all active:scale-[0.98]"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Start Verification
            </button>
          </div>
        )}

        {/* Step 1 — National ID */}
        {step === 1 && (
          <div className="space-y-[20px]">
            <div>
              <p className="font-bold text-[18px] text-[#65584f] mb-[4px]" style={{ fontFamily: M }}>National ID Card</p>
              <p className="text-[13px] text-[#65584f]/60" style={{ fontFamily: M }}>Upload both sides of your Thai national ID card or passport.</p>
            </div>
            <UploadBox label="Front side" sublabel="Clear photo — all 4 corners visible" file={idFront} onChange={setIdFront} />
            <UploadBox label="Back side" sublabel="Show the barcode clearly" file={idBack} onChange={setIdBack} />
            <button
              disabled={!idFront || !idBack}
              onClick={() => setStep(2)}
              className="w-full rounded-full py-[15px] text-white font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Proof of Address */}
        {step === 2 && (
          <div className="space-y-[20px]">
            <div>
              <p className="font-bold text-[18px] text-[#65584f] mb-[4px]" style={{ fontFamily: M }}>Proof of Address</p>
              <p className="text-[13px] text-[#65584f]/60" style={{ fontFamily: M }}>Utility bill, bank statement, or any official letter showing your name and address (issued within 3 months).</p>
            </div>
            <UploadBox label="Address document" sublabel="JPG, PNG or PDF accepted" file={proof} onChange={setProof} />
            <div className="rounded-[14px] p-[14px]" style={{ background: "rgba(214,200,173,0.3)" }}>
              <p className="text-[12px] text-[#65584f]/70" style={{ fontFamily: M }}>
                Accepted: electricity bill, water bill, phone bill, bank statement, or household registration book (ทะเบียนบ้าน).
              </p>
            </div>
            <button
              disabled={!proof}
              onClick={() => setStep(3)}
              className="w-full rounded-full py-[15px] text-white font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              Submit Documents
            </button>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center pt-[20px] pb-[40px]">
            <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-[24px]" style={{ background: "#cd8188" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-bold text-[28px] text-[#65584f] mb-[12px]" style={{ fontFamily: M }}>Documents Submitted!</p>
            <p className="text-[14px] text-[#65584f]/70 mb-[32px] max-w-[280px]" style={{ fontFamily: M }}>
              We'll review your documents within 1–2 business days and notify you once verified.
            </p>
            <div className="w-full rounded-[16px] p-[16px] space-y-[12px] mb-[24px]" style={{ background: "white" }}>
              {[
                { icon: "🪪", label: "National ID", status: "Submitted" },
                { icon: "🏠", label: "Proof of Address", status: "Submitted" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[20px]">{item.icon}</span>
                    <span className="text-[14px] text-[#65584f]" style={{ fontFamily: M }}>{item.label}</span>
                  </div>
                  <span className="text-[12px] font-semibold rounded-full px-[10px] py-[3px]" style={{ background: "rgba(205,129,136,0.15)", color: "#cd8188" }}>{item.status}</span>
                </div>
              ))}
            </div>
            <Link
              href="/appointments"
              className="w-full rounded-full py-[15px] text-white font-bold text-[16px] text-center block transition-all active:scale-[0.98]"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              View Appointments
            </Link>
            <Link
              href="/swipe"
              className="mt-[12px] text-[14px] font-semibold text-[#65584f]/60"
              style={{ fontFamily: M }}
            >
              Back to browsing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
