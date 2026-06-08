"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy } from "lucide-react";
import generatePromptPayPayload from "promptpay-qr";
import QRCode from "qrcode";
import { markIntentViewedQR } from "@/app/donations/actions";

const M = "Montserrat, sans-serif";
const BG = "#F5EBDC";
const PINK = "#cd8188";
const BROWN = "#65584f";

type DonateScreenProps = {
  dogId: string;
  dogName: string;
  dogPhotoUrl: string | null;
  shelterName: string;
  intentId: string | null;
  treatCount: number | null;
  amountThb: number | null;
  promptpayId: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

function CopyRow({
  label,
  value,
  copyValue,
  mono = false,
  bold = false,
}: {
  label: string;
  value: string;
  copyValue?: string;
  mono?: boolean;
  bold?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — silently ignore.
    }
  }

  return (
    <div className="flex items-center justify-between gap-[12px] py-[12px]">
      <span
        className="text-[13px] text-[#8d7f72] flex-shrink-0"
        style={{ fontFamily: M }}
      >
        {label}
      </span>
      <div className="flex items-center gap-[10px] min-w-0">
        <span
          className={`text-[14px] truncate ${bold ? "font-bold" : "font-medium"}`}
          style={{
            fontFamily: mono ? "ui-monospace, monospace" : M,
            color: bold ? PINK : BROWN,
          }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="flex items-center gap-[4px] rounded-full px-[8px] py-[5px] active:scale-95 transition-all flex-shrink-0"
          style={{ background: copied ? "rgba(112,160,120,0.16)" : "rgba(101,88,79,0.08)" }}
        >
          {copied ? (
            <>
              <Check size={14} stroke="#5f8d68" strokeWidth={2.6} />
              <span className="text-[11px] font-semibold" style={{ color: "#5f8d68", fontFamily: M }}>
                Copied
              </span>
            </>
          ) : (
            <Copy size={14} stroke={BROWN} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[22px] bg-white px-[20px] py-[22px]"
      style={{ boxShadow: "0 1px 3px rgba(101,88,79,0.06)" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7f72]"
      style={{ fontFamily: M }}
    >
      {children}
    </p>
  );
}

export default function DonateScreen({
  dogId,
  dogName,
  dogPhotoUrl,
  shelterName,
  intentId,
  treatCount,
  amountThb,
  promptpayId,
  bankName,
  bankAccountNumber,
  bankAccountName,
}: DonateScreenProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Fire-and-forget: mark the intent as viewed. Silent failure.
  useEffect(() => {
    if (!intentId) return;
    markIntentViewedQR(intentId).catch(() => {});
  }, [intentId]);

  // Render the PromptPay QR with the amount embedded so banking apps pre-fill it.
  useEffect(() => {
    let cancelled = false;
    if (!promptpayId) {
      setQrDataUrl("");
      return;
    }
    const payload = generatePromptPayPayload(
      promptpayId,
      amountThb ? { amount: amountThb } : {}
    );
    QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 480 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [promptpayId, amountThb]);

  const hasPromptPay = Boolean(promptpayId);
  const hasBank = Boolean(bankName && bankAccountNumber && bankAccountName);
  const allMethodsSet = hasPromptPay && hasBank;
  const amountLabel = amountThb !== null ? `฿${amountThb.toLocaleString()}` : null;
  const treatsLabel =
    treatCount !== null
      ? `${treatCount} treat${treatCount === 1 ? "" : "s"}${amountLabel ? ` · ${amountLabel}` : ""}`
      : null;

  const Header = (
    <div className="sticky top-0 z-10 flex items-center px-[16px] py-[14px]" style={{ background: BG }}>
      <Link
        href={`/dogs/${dogId}`}
        aria-label="Back"
        className="flex h-[40px] w-[40px] items-center justify-center rounded-full active:scale-95 transition-all"
        style={{ background: "rgba(101,88,79,0.08)" }}
      >
        <ArrowLeft size={22} stroke={BROWN} strokeWidth={2.2} />
      </Link>
      <h1
        className="flex-1 text-center text-[18px] font-bold pr-[40px]"
        style={{ fontFamily: M, color: BROWN }}
      >
        Send Treats
      </h1>
    </div>
  );

  // Full empty state — no donation methods at all.
  if (!hasPromptPay && !hasBank) {
    return (
      <div
        className="relative mx-auto min-h-[100dvh]"
        style={{ maxWidth: "402px", background: BG, fontFamily: M }}
      >
        {Header}
        <div className="flex flex-col items-center justify-center px-[32px] py-[80px] text-center">
          <p className="text-[16px] font-semibold" style={{ color: BROWN }}>
            {shelterName} hasn&apos;t set up donations yet.
          </p>
          <p className="mt-[8px] text-[14px] text-[#8d7f72]">Check back soon!</p>
          <Link
            href={`/dogs/${dogId}`}
            className="mt-[28px] rounded-full px-[28px] py-[12px] text-[14px] font-semibold text-white active:scale-95 transition-all"
            style={{ background: PINK }}
          >
            Back to {dogName}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto min-h-[100dvh]"
      style={{ maxWidth: "402px", background: BG, fontFamily: M }}
    >
      {Header}

      <div className="flex flex-col gap-[16px] px-[16px] pb-[24px] pt-[6px]">
        {/* Summary card */}
        <div className="flex items-center gap-[12px] rounded-[22px] px-[18px] py-[16px]" style={{ background: "#efe3cf" }}>
          <div className="h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full" style={{ background: "#e6dcc4" }}>
            {dogPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dogPhotoUrl} alt={dogName} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold" style={{ color: BROWN }}>
              {dogName}
            </p>
            <p className="truncate text-[12px] text-[#8d7f72]">{shelterName}</p>
          </div>
          {treatsLabel ? (
            <span className="flex-shrink-0 text-[14px] font-bold" style={{ color: PINK }}>
              {treatsLabel}
            </span>
          ) : null}
        </div>

        {/* Partial-setup notice */}
        {!allMethodsSet ? (
          <div
            className="rounded-[16px] px-[16px] py-[12px] text-[13px] leading-5"
            style={{ background: "#fbf2e2", color: "#9a7b4f" }}
          >
            This shelter hasn&apos;t set up all donation methods yet.
          </div>
        ) : null}

        {/* QR section */}
        {hasPromptPay ? (
          <Card>
            <SectionLabel>Scan to pay</SectionLabel>
            <div className="mt-[16px] flex justify-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="PromptPay QR code" className="h-[240px] w-[240px]" />
              ) : (
                <div className="flex h-[240px] w-[240px] items-center justify-center rounded-[12px] border border-dashed border-[#d8c7ad] text-[12px] text-[#8d7f72]">
                  Generating QR…
                </div>
              )}
            </div>
            <p className="mt-[16px] text-center text-[13px] leading-5 text-[#8d7f72]">
              Open any Thai banking app and scan. Amount is pre-filled.
            </p>
          </Card>
        ) : null}

        {/* Bank transfer section */}
        {hasBank ? (
          <Card>
            <SectionLabel>Or transfer manually</SectionLabel>
            <div className="mt-[8px] divide-y divide-[#f0e7d8]">
              <CopyRow label="Bank" value={bankName!} />
              <CopyRow label="Account number" value={bankAccountNumber!} mono />
              <CopyRow label="Account name" value={bankAccountName!} />
              {amountLabel ? (
                <CopyRow label="Amount" value={amountLabel} copyValue={String(amountThb)} bold />
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* Reminder footer */}
        <p className="px-[16px] pt-[4px] text-center text-[12px] leading-5" style={{ color: "#9a8c7a" }}>
          Your transfer goes directly to {shelterName}. PAWJAI doesn&apos;t handle the funds.
        </p>
      </div>
    </div>
  );
}
