"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptRescheduleRequestAction, cancelAppointmentFromListAction } from "@/app/appointments/actions";
import { cancelAppointmentAction, sendAppointmentMessageAction, submitReturnInquiryAction } from "@/app/appointments/[id]/actions";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import MachineTranslatedText from "@/components/i18n/MachineTranslatedText";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { parseReturnInquiryMessageBody } from "@/utils/appointment-messages";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

const M = "Montserrat, sans-serif";
const MESSAGE_THREAD_REFRESH_INTERVAL_MS = 12_000;
const APPOINTMENT_MESSAGE_ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,application/pdf,image/heic,image/heif,image/jpeg,image/png,image/webp,video/mp4,video/quicktime";

type Tab = "details" | "messages" | "help";

// Map raw DB status to UI display status.
// DB enum: requested|confirmed|completed|cancelled|no_show, plus future pending|denied (Codex).
export type DisplayStatus = "pending" | "accepted" | "denied" | "cancelled" | "completed";

export function normalizeStatus(raw: string | null | undefined): DisplayStatus {
  switch (raw) {
    case "pending":
    case "requested":
      return "pending";
    case "accepted":
    case "confirmed":
      return "accepted";
    case "denied":
      return "denied";
    case "cancelled":
    case "no_show":
      return "cancelled";
    case "completed":
      return "completed";
    default:
      return "pending";
  }
}

interface Props {
  adoptionContext: {
    adoptionDate: string | null;
    isAdopted: boolean;
  } | null;
  appointmentId: string;
  bookingId: string;
  initialMessages: AppointmentThreadMessage[];
  initialTab?: Tab;
  messagesUnavailable?: boolean;
  qrSvg: string;
  status: string | null;
  proposedDate: string | null;
  proposedTime: string | null;
  rescheduleNote: string | null;
  isPast: boolean;
  dog: {
    id: string;
    name: string;
    nameTh: string | null;
    breed: string | null;
    coverUrl: string | null;
  } | null;
  shelter: {
    name: string;
    nameTh: string | null;
    phone: string | null;
    email: string | null;
    addressLines: string[];
    addressLinesTh: string[];
    googleMapsUrl: string | null;
    latitude: number | null;
    logoUrl: string | null;
    longitude: number | null;
    meetingInstructions: string | null;
    meetingInstructionsTh: string | null;
  } | null;
  time: {
    weekday: string;
    monthDay: string;
    start: string;
    end: string;
  };
  shelterNote: string | null;
  visitorNote: string | null;
}

export type AppointmentThreadMessage = {
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentUrl?: string | null;
  body: string;
  createdAt: string;
  id: string;
  senderLabel: string | null;
  senderRole: "adopter" | "shelter" | "system";
};

type DraftMessageAttachment = {
  kind: "file" | "image" | "video";
  name: string;
  previewUrl: string | null;
  sizeLabel: string;
  typeLabel: string;
};

function isPreviewableMessageImage(type: string | null | undefined, name = "") {
  return type === "image/jpeg"
    || type === "image/png"
    || type === "image/webp"
    || /\.(jpe?g|png|webp)$/i.test(name);
}

function isPreviewableMessageVideo(type: string | null | undefined, name = "") {
  return type === "video/mp4"
    || type === "video/quicktime"
    || /\.(mp4|mov)$/i.test(name);
}

function formatAttachmentSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function attachmentTypeLabel(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (type === "image/heic" || name.endsWith(".heic")) return "HEIC image";
  if (type === "image/heif" || name.endsWith(".heif")) return "HEIF image";
  if (type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(name)) return "Image";
  if (type.startsWith("video/") || /\.(mp4|mov)$/i.test(name)) return "Video";
  return "File";
}

function createDraftMessageAttachment(file: File): DraftMessageAttachment {
  const type = file.type.toLowerCase();
  const previewImage = isPreviewableMessageImage(type, file.name);
  const previewVideo = isPreviewableMessageVideo(type, file.name);
  const kind = previewImage ? "image" : previewVideo ? "video" : "file";

  return {
    kind,
    name: file.name,
    previewUrl: kind === "file" ? null : URL.createObjectURL(file),
    sizeLabel: formatAttachmentSize(file.size),
    typeLabel: attachmentTypeLabel(file),
  };
}

function isGeneratedAttachmentBody(body: string, attachmentName: string | null | undefined) {
  if (!attachmentName) return false;
  const text = body.trim();
  return text === `Attachment: ${attachmentName}` || text === `Photo attached: ${attachmentName}`;
}

function DraftAttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: DraftMessageAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="mx-[14px] mb-[12px] flex items-center gap-[10px] overflow-hidden rounded-[16px] border border-[#eadfce] bg-[#fffaf5] p-[10px]">
      <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[12px] bg-[#f5f0e8]">
        {attachment.kind === "image" && attachment.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={attachment.name} className="h-full w-full object-cover" src={attachment.previewUrl} />
        ) : null}
        {attachment.kind === "video" && attachment.previewUrl ? (
          <video className="h-full w-full object-cover" muted preload="metadata" src={attachment.previewUrl} />
        ) : null}
        {attachment.kind === "file" ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#cd8188]" style={{ fontFamily: M }}>
              {attachment.typeLabel}
            </span>
          </div>
        ) : null}
        <span className="absolute right-[5px] top-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#cd8188]">
          <svg aria-hidden="true" height="12" viewBox="0 0 24 24" width="12">
            <path d="M20 6 9 17l-5-5" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </svg>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#cd8188]" style={{ fontFamily: M }}>
          Ready to send
        </p>
        <p className="mt-[2px] truncate text-[14px] font-bold text-[#65584f]" data-i18n-ignore style={{ fontFamily: M }}>
          {attachment.name}
        </p>
        <p className="mt-[1px] text-[12px] text-[#65584f]/60" style={{ fontFamily: M }}>
          {attachment.typeLabel} - {attachment.sizeLabel}
        </p>
      </div>
      <button
        aria-label={`Remove ${attachment.name}`}
        className="rounded-full px-[10px] py-[8px] text-[12px] font-bold text-[#65584f]/70 active:scale-95"
        onClick={onRemove}
        type="button"
      >
        Remove
      </button>
    </div>
  );
}

function SecureAppointmentMessageAttachment({
  fromMe,
  message,
}: {
  fromMe: boolean;
  message: AppointmentThreadMessage;
}) {
  const [failed, setFailed] = useState(false);
  const hasAttachment = Boolean(message.attachmentName || message.attachmentType || message.attachmentUrl);

  if (!hasAttachment) return null;

  const attachmentUrl = message.attachmentUrl;
  const unavailable = !attachmentUrl || failed;
  const hintClass = fromMe ? "text-white/80" : "text-[#65584f]/65";

  if (unavailable) {
    return (
      <p className={`mb-[8px] text-[12px] leading-[1.4] ${hintClass}`} role="status">
        Attachment unavailable. Refresh this page to request a new secure link.
      </p>
    );
  }

  const previewImage = isPreviewableMessageImage(message.attachmentType, message.attachmentName ?? "");
  const previewVideo = isPreviewableMessageVideo(message.attachmentType, message.attachmentName ?? "");

  return (
    <div className="mb-[8px]">
      {previewImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachmentUrl}
          alt={message.attachmentName ?? "Appointment attachment"}
          className="mb-[8px] max-h-[260px] w-full rounded-[12px] object-cover"
          onError={() => setFailed(true)}
        />
      ) : null}
      {previewVideo ? (
        <video
          className="mb-[8px] max-h-[260px] w-full rounded-[12px] bg-black"
          controls
          onError={() => setFailed(true)}
          preload="metadata"
        >
          <source src={attachmentUrl} type={message.attachmentType ?? undefined} />
          <a href={attachmentUrl} rel="noreferrer" target="_blank">View attachment</a>
        </video>
      ) : null}
      {!previewImage && !previewVideo ? (
        <a
          className={`inline-flex text-[13px] font-semibold underline ${fromMe ? "text-white" : "text-[#9a6b2a]"}`}
          href={attachmentUrl}
          rel="noreferrer"
          target="_blank"
        >
          {message.attachmentName ?? "View attachment"}
        </a>
      ) : null}
      <p className={`mt-[4px] text-[10px] leading-[1.35] ${hintClass}`}>
        Secure link expires after one hour. Refresh this page for a new link.
      </p>
    </div>
  );
}

function ReturnInquiryThreadCard({
  createdAt,
  fromMe,
  reason,
}: {
  createdAt: string;
  fromMe: boolean;
  reason: string;
}) {
  return (
    <div className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%] rounded-[20px] border border-[#e7c6ca] bg-[#fff7f8] px-[16px] py-[14px] shadow-[0_10px_28px_rgba(101,88,79,0.10)]">
        <div className="flex items-center justify-between gap-[10px]">
          <span className="rounded-full bg-[#cd8188] px-[10px] py-[4px] text-[10px] font-extrabold uppercase tracking-[0.14em] text-white" style={{ fontFamily: M }}>
            Return request
          </span>
          <span className="text-[11px] text-[#65584f]/50" style={{ fontFamily: M }}>
            {new Date(createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <p className="mt-[10px] text-[15px] font-extrabold leading-[1.25] text-[#65584f]" style={{ fontFamily: M }}>
          {fromMe ? "Return inquiry sent" : "Return inquiry received"}
        </p>
        <div className="mt-[10px] rounded-[16px] bg-white px-[12px] py-[10px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#cd8188]" style={{ fontFamily: M }}>
            Reason
          </p>
          <p className="mt-[4px] whitespace-pre-wrap text-[14px] leading-[1.45] text-[#65584f]" style={{ fontFamily: M }}>
            {reason}
          </p>
        </div>
        <p className="mt-[10px] text-[12px] leading-[1.45] text-[#65584f]/70" style={{ fontFamily: M }}>
          The shelter can reply here, and PawJai support can review this request if help is needed.
        </p>
      </div>
    </div>
  );
}

export default function AppointmentDetailClient({
  adoptionContext,
  appointmentId,
  bookingId,
  dog,
  initialMessages,
  initialTab = "details",
  messagesUnavailable = false,
  qrSvg,
  proposedDate,
  proposedTime,
  rescheduleNote,
  status,
  isPast,
  shelter,
  time,
}: Props) {
  const displayStatus = normalizeStatus(status);
  const [tab, setTab] = useState<Tab>(initialTab);
  const { language } = useLanguage();
  const dogDisplayName = dog ? language === "th" && dog.nameTh ? dog.nameTh : dog.name : "Visit";

  const mapsHref = shelter
    ? shelter.googleMapsUrl
      ? shelter.googleMapsUrl
      : shelter.latitude != null && shelter.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}`
      : shelter.addressLines.length > 0
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.addressLines.join(", "))}`
        : null
    : null;

  return (
    <div
      className="relative"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100dvh",
        paddingBottom: "90px",
        background: "white",
        fontFamily: M,
      }}
    >
      {/* ── Dark brown app bar with logo top-left ── */}
      <div
        className="px-[14px] pt-[14px] pb-[14px] relative"
        style={{ background: "#65584f" }}
      >
        {/* Logo top-left — doubles as home link */}
        <div className="mb-[12px] flex items-start justify-between">
          <Link
            href="/"
            className="block h-[52px] w-[52px] active:scale-95 transition-transform"
            aria-label="PawJai home"
            style={{ filter: "brightness(0) invert(1)" }}
          >
            <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
          </Link>
          <LanguageSwitcher className="mt-[2px]" />
        </div>

        <div className="flex items-center gap-[12px]">
          <div className="w-[48px] h-[48px] rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            {dog?.coverUrl ? (
              <img src={dog.coverUrl} alt={dog.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-white truncate" style={{ fontFamily: M }}>
              <MachineTranslatedText text="Appointment" />
            </p>
            <p className="text-[13px] text-white/75 truncate" style={{ fontFamily: M }}>{dogDisplayName}</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex sticky top-0 z-10"
        style={{ background: "#65584f", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        {(
          [
            ["details", "DETAILS"],
            ["messages", "MESSAGES"],
            ["help", "HELP"],
          ] as [Tab, string][]
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="flex-1 py-[14px] text-[13px] font-bold tracking-wider transition-colors"
              style={{
                color: active ? "#cd8188" : "rgba(255,255,255,0.65)",
                borderBottom: active ? "3px solid #cd8188" : "3px solid transparent",
                fontFamily: M,
              }}
            >
              <MachineTranslatedText text={label} />
            </button>
          );
        })}
      </div>

      {/* ── Tab contents ── */}
      {tab === "details" && (
        <DetailsTab
          appointmentId={appointmentId}
          bookingId={bookingId}
          dog={dog}
          dogDisplayName={dogDisplayName}
          qrSvg={qrSvg}
          proposedDate={proposedDate}
          proposedTime={proposedTime}
          rescheduleNote={rescheduleNote}
          status={displayStatus}
          isPast={isPast}
          shelter={shelter}
          time={time}
          mapsHref={mapsHref}
        />
      )}

      {tab === "messages" && (
        <MessagesTab
          adoptionContext={adoptionContext}
          appointmentId={appointmentId}
          dogName={dogDisplayName}
          initialMessages={initialMessages}
          messagesUnavailable={messagesUnavailable}
          shelter={shelter}
        />
      )}

      {tab === "help" && <HelpTab />}
    </div>
  );
}

function DetailsTab({
  appointmentId,
  bookingId,
  dog,
  dogDisplayName,
  qrSvg,
  proposedDate,
  proposedTime,
  rescheduleNote,
  status,
  isPast,
  shelter,
  time,
  mapsHref,
}: {
  appointmentId: string;
  bookingId: string;
  dog: Props["dog"];
  dogDisplayName: string;
  qrSvg: string;
  proposedDate: string | null;
  proposedTime: string | null;
  rescheduleNote: string | null;
  status: DisplayStatus;
  isPast: boolean;
  shelter: Props["shelter"];
  time: Props["time"];
  mapsHref: string | null;
}) {
  const { language } = useLanguage();
  const addressLines = language === "th" && shelter?.addressLinesTh.length ? shelter.addressLinesTh : shelter?.addressLines ?? [];
  const meetingInstructions = language === "th" && shelter?.meetingInstructionsTh
    ? shelter.meetingInstructionsTh
    : shelter?.meetingInstructions ?? null;

  return (
    <div className="px-[18px] pt-[24px] pb-[40px] space-y-[28px]">
      {/* Time range */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: M }}>
            <MachineTranslatedText text={`${time.weekday}, ${time.monthDay}`} />
          </p>
          <p className="font-bold text-[28px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>
            <MachineTranslatedText text={time.start || "—"} />
          </p>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <div className="text-right">
          <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: M }}>
            <MachineTranslatedText text={`${time.weekday}, ${time.monthDay}`} />
          </p>
          <p className="font-bold text-[28px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>
            <MachineTranslatedText text={time.end || "—"} />
          </p>
        </div>
      </div>

      {/* Status box — new UI block (#7) */}
      <StatusBox status={status} />

      {proposedDate && proposedTime && !isPast && status !== "cancelled" && status !== "completed" && (
        <RescheduleRequestPanel
          appointmentId={appointmentId}
          note={rescheduleNote}
          proposedDate={proposedDate}
          proposedTime={proposedTime}
        />
      )}

      {/* Meeting at */}
      {shelter && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
            <MachineTranslatedText text="MEETING AT" />
          </p>
          <div className="rounded-[14px] p-[18px]" style={{ background: "#f5f0e8" }}>
            <div className="flex items-center gap-[12px]">
              {shelter.logoUrl && (
                <img src={shelter.logoUrl} alt={`${shelter.name} logo`} className="h-[42px] w-[42px] rounded-[10px] object-cover" />
              )}
              <p className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
                {shelter.nameTh ?? shelter.name}
              </p>
            </div>
            {addressLines.length > 0 && (
              <p className="text-[14px] text-[#65584f] mt-[8px] leading-[1.45]" style={{ fontFamily: M }}>
                {addressLines.join(", ")}
              </p>
            )}
            {meetingInstructions && (
              <p className="text-[13px] text-[#65584f]/70 mt-[8px] leading-[1.45]" style={{ fontFamily: M }}>
                <MachineTranslatedText text={meetingInstructions} />
              </p>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-[14px] text-[14px] font-bold"
                style={{ color: "#cd8188", fontFamily: M }}
              >
                <MachineTranslatedText text="Click to access Google Maps" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Dog information */}
      {dog && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
            <MachineTranslatedText text="DOG INFORMATION" />
          </p>
          <Link
            href={`/dogs/${dog.id}`}
            className="flex items-center gap-[14px] rounded-[14px] p-[14px] active:scale-[0.99] transition-transform"
            style={{ background: "#f5f0e8" }}
          >
            <div className="w-[60px] h-[60px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[#d6c8ad]">
              {dog.coverUrl ? (
                <img src={dog.coverUrl} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-bold text-[#65584f] truncate" style={{ fontFamily: M }}>{dogDisplayName}</p>
              {dog.breed && (
                <p className="text-[14px] text-[#65584f]/65 truncate" style={{ fontFamily: M }}>
                  <MachineTranslatedText text={dog.breed} />
                </p>
              )}
            </div>
            <span className="text-[#cd8188] text-[22px] font-bold">›</span>
          </Link>
        </section>
      )}

      {/* Shelter contact */}
      {shelter && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
            <MachineTranslatedText text="SHELTER CONTACT" />
          </p>
          <div className="rounded-[14px] p-[18px]" style={{ background: "#f5f0e8" }}>
            <div className="flex items-center gap-[12px]">
              {shelter.logoUrl && (
                <img src={shelter.logoUrl} alt={`${shelter.name} logo`} className="h-[42px] w-[42px] rounded-[10px] object-cover" />
              )}
              <p className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
                {shelter.nameTh ?? shelter.name}
              </p>
            </div>
            {shelter.phone && (
              <a href={`tel:${shelter.phone}`} className="mt-[10px] flex items-center gap-[8px] text-[14px] text-[#65584f]" style={{ fontFamily: M }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {shelter.phone}
              </a>
            )}
            {shelter.email && (
              <a href={`mailto:${shelter.email}`} className="mt-[6px] flex items-center gap-[8px] text-[14px] text-[#65584f]" style={{ fontFamily: M }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {shelter.email}
              </a>
            )}
          </div>
        </section>
      )}

      {/* QR check-in */}
      <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="CHECK-IN QR CODE" />
        </p>
        <div className="rounded-[14px] p-[24px] flex flex-col items-center" style={{ border: "1.5px solid rgba(101,88,79,0.18)" }}>
          <div
            className="w-[184px] h-[184px] [&_svg]:h-full [&_svg]:w-full"
            aria-label={`Check-in QR code for ${bookingId}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <p className="mt-[20px] text-[11px] tracking-[0.16em] font-semibold text-[#65584f]/55" style={{ fontFamily: M }}>
            <MachineTranslatedText text="BOOKING ID" />
          </p>
          <p className="mt-[2px] text-[22px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
            {bookingId}
          </p>

          <div className="mt-[18px] w-full rounded-[10px] px-[16px] py-[12px]" style={{ background: "#f5f0e8" }}>
            <p className="text-[13px] text-[#65584f]/65" style={{ fontFamily: M }}>
              <MachineTranslatedText text={`${time.weekday}, ${time.monthDay}`} />
            </p>
            <p className="font-bold text-[20px] text-[#65584f]" style={{ fontFamily: M }}>
              <MachineTranslatedText text={time.start || "—"} />
            </p>
          </div>

          <p className="mt-[14px] text-[13px] text-[#65584f]/55 text-center" style={{ fontFamily: M }}>
            <MachineTranslatedText text="Show this QR code at the shelter entrance" />
          </p>
        </div>
      </section>

      {/* Cancel appointment — new UI element (#2) */}
      {!isPast && status !== "cancelled" && status !== "denied" && status !== "completed" && (
        <CancelAppointmentButton appointmentId={appointmentId} />
      )}
    </div>
  );
}

function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await cancelAppointmentAction(appointmentId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="w-full rounded-[14px] py-[14px] text-[15px] font-bold active:scale-[0.99] transition-transform"
        style={{
          fontFamily: M,
          color: "#b3565e",
          background: "transparent",
          border: "1.5px solid rgba(179,86,94,0.4)",
        }}
      >
        <MachineTranslatedText text="Cancel Appointment" />
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-[18px]"
          onClick={() => !isPending && setConfirmOpen(false)}
          style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[362px] rounded-[20px] bg-white px-[20px] py-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[20px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
              <MachineTranslatedText text="Cancel this appointment?" />
            </p>
            <p className="mt-[10px] text-[14px] leading-[1.55] text-[#65584f]/70" style={{ fontFamily: M }}>
              <MachineTranslatedText text="The shelter will be notified. You can book another time anytime." />
            </p>
            <div className="mt-[20px] flex gap-[10px]">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="h-[48px] flex-1 rounded-[14px] text-[14px] font-bold disabled:opacity-60"
                style={{ background: "rgba(101,88,79,0.1)", color: "#65584f", fontFamily: M }}
              >
                <MachineTranslatedText text="Keep" />
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] text-[14px] font-bold text-white disabled:opacity-60"
                style={{ background: "#b3565e", fontFamily: M }}
              >
                <MachineTranslatedText text={isPending ? "Cancelling..." : "Yes, cancel"} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RescheduleRequestPanel({
  appointmentId,
  note,
  proposedDate,
  proposedTime,
}: {
  appointmentId: string;
  note: string | null;
  proposedDate: string;
  proposedTime: string;
}) {
  const dateLabel = new Date(`${proposedDate}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
  const timeLabel = new Date(`1970-01-01T${proposedTime.slice(0, 5)}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section className="rounded-[14px] border border-[#eadfce] bg-[#fffaf2] p-[16px]">
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#8d7f72]" style={{ fontFamily: M }}>
        <MachineTranslatedText text="DATE CHANGE REQUEST" />
      </p>
      <p className="mt-[8px] text-[18px] font-bold leading-[1.35] text-[#65584f]" style={{ fontFamily: M }}>
        <MachineTranslatedText text={`${dateLabel} at ${timeLabel}`} />
      </p>
      {note ? (
        <p className="mt-[6px] text-[13px] leading-[1.5] text-[#65584f]/70" style={{ fontFamily: M }}>
          <MachineTranslatedText text={note} />
        </p>
      ) : null}
      <div className="mt-[14px] grid grid-cols-3 gap-[8px]">
        <form action={acceptRescheduleRequestAction}>
          <input name="appointmentId" type="hidden" value={appointmentId} />
          <button className="h-[42px] w-full rounded-full bg-[#3f7d34] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
            <MachineTranslatedText text="Accept" />
          </button>
        </form>
        <Link
          className="flex h-[42px] items-center justify-center rounded-full border border-[#eadfce] bg-white px-[10px] text-center text-[12px] font-bold text-[#65584f]"
          href={`/appointments?edit=${appointmentId}`}
          style={{ fontFamily: M }}
        >
          <MachineTranslatedText text="Different" />
        </Link>
        <form action={cancelAppointmentFromListAction}>
          <input name="appointmentId" type="hidden" value={appointmentId} />
          <button className="h-[42px] w-full rounded-full bg-[#c46f75] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
            <MachineTranslatedText text="Cancel" />
          </button>
        </form>
      </div>
    </section>
  );
}

function StatusBox({ status }: { status: DisplayStatus }) {
  const config: Record<DisplayStatus, { label: string; explain: string; bg: string; fg: string; dot: string }> = {
    pending: {
      label: "Pending",
      explain: "Waiting for shelter to confirm",
      bg: "rgba(217,164,77,0.12)",
      fg: "#a07223",
      dot: "#d9a44d",
    },
    accepted: {
      label: "Accepted",
      explain: "Confirmed — see you there!",
      bg: "rgba(56,142,76,0.10)",
      fg: "#2f6f3f",
      dot: "#388e4c",
    },
    denied: {
      label: "Denied",
      explain: "Shelter could not accommodate this time",
      bg: "rgba(179,86,94,0.10)",
      fg: "#8b3a42",
      dot: "#b3565e",
    },
    cancelled: {
      label: "Cancelled",
      explain: "You cancelled this appointment",
      bg: "rgba(101,88,79,0.10)",
      fg: "#65584f",
      dot: "#9b8e83",
    },
    completed: {
      label: "Completed",
      explain: "Visit complete",
      bg: "rgba(56,142,76,0.08)",
      fg: "#2f6f3f",
      dot: "#388e4c",
    },
  };
  const c = config[status];
  return (
    <div className="rounded-[14px] px-[16px] py-[14px] flex items-center gap-[12px]" style={{ background: c.bg, fontFamily: M }}>
      <span className="inline-block w-[10px] h-[10px] rounded-full shrink-0" style={{ background: c.dot }} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold leading-[1.1]" style={{ color: c.fg }}>
          <MachineTranslatedText text={c.label} />
        </p>
        <p className="text-[13px] mt-[2px] leading-[1.35]" style={{ color: c.fg, opacity: 0.78 }}>
          <MachineTranslatedText text={c.explain} />
        </p>
      </div>
    </div>
  );
}

function MessagesTab({
  adoptionContext,
  appointmentId,
  dogName,
  initialMessages,
  messagesUnavailable,
  shelter,
}: {
  adoptionContext: Props["adoptionContext"];
  appointmentId: string;
  dogName: string;
  initialMessages: AppointmentThreadMessage[];
  messagesUnavailable: boolean;
  shelter: Props["shelter"];
}) {
  const router = useRouter();
  const attachRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<DraftMessageAttachment | null>(null);

  function clearSelectedAttachment() {
    setSelectedAttachment(null);
    if (attachRef.current) attachRef.current.value = "";
  }

  function focusDraft() {
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
    });
  }

  useEffect(() => {
    return () => {
      if (selectedAttachment?.previewUrl) URL.revokeObjectURL(selectedAttachment.previewUrl);
    };
  }, [selectedAttachment?.previewUrl]);

  useEffect(() => {
    if (!returnOpen && !helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
      if (e.key === "Escape") setReturnOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, returnOpen]);

  useEffect(() => {
    if (messagesUnavailable) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    const interval = window.setInterval(refreshIfVisible, MESSAGE_THREAD_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [messagesUnavailable, router]);

  useEffect(() => {
    if (messagesUnavailable) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`appointment-messages:${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `appointment_id=eq.${appointmentId}`,
          schema: "public",
          table: "appointment_messages",
        },
        () => {
          if (document.visibilityState === "visible") {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appointmentId, messagesUnavailable, router]);

  const chatMessages: AppointmentThreadMessage[] = [
    ...(adoptionContext?.isAdopted
      ? [
          {
            body: `Adoption completed for ${dogName}${adoptionContext.adoptionDate ? ` on ${adoptionContext.adoptionDate}` : ""}. This thread is now the care and shelter support chat for this adopted pet.`,
            createdAt: adoptionContext.adoptionDate ? `${adoptionContext.adoptionDate}T00:00:00.000Z` : new Date().toISOString(),
            id: "system-adoption-completed",
            senderLabel: "PawJai",
            senderRole: "system" as const,
          },
        ]
      : []),
    ...(initialMessages.length > 0
      ? initialMessages
      : [
          {
            body: `Hello! Thank you for booking an appointment to meet ${dogName}. Message the shelter here if you have visit questions.`,
            createdAt: new Date().toISOString(),
            id: "system-welcome",
            senderLabel: "PawJai",
            senderRole: "system" as const,
          },
        ]),
  ];

  function handleAttachment(files: FileList | null) {
    if (!files?.length) {
      clearSelectedAttachment();
      return;
    }
    const file = files[0];
    setSelectedAttachment(createDraftMessageAttachment(file));
    setHelpOpen(false);
    setReturnOpen(false);
    focusDraft();
  }

  function formatMessageTime(value: string) {
    return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 240px)" }}>
      {/* Hidden file input — single native picker (#4) */}
      <input
        ref={attachRef}
        name="attachment"
        type="file"
        accept={APPOINTMENT_MESSAGE_ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => handleAttachment(e.target.files)}
      />

      <div className="flex-1 px-[16px] py-[20px] space-y-[16px] overflow-y-auto">
        {messagesUnavailable && (
          <div className="rounded-[14px] border border-[#eadfce] bg-[#fffaf2] px-[14px] py-[12px]">
            <p className="text-[13px] leading-[1.45] text-[#65584f]" style={{ fontFamily: M }}>
              Messages are temporarily unavailable. Please try again soon.
            </p>
          </div>
        )}
        <p className="text-center text-[11px] font-semibold tracking-[0.14em] text-[#65584f]/45" style={{ fontFamily: M }}>
          TUESDAY, APR 7, 2026
        </p>
        {chatMessages.map((msg) => {
          const fromMe = msg.senderRole === "adopter";
          const returnInquiry = parseReturnInquiryMessageBody(msg.body);
          if (returnInquiry) {
            return (
              <ReturnInquiryThreadCard
                createdAt={msg.createdAt}
                fromMe={fromMe}
                key={msg.id}
                reason={returnInquiry.reason}
              />
            );
          }
          return (
          <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[78%]">
              <div
                className="rounded-[18px] px-[16px] py-[12px] overflow-hidden"
                style={{
                  background: fromMe ? "#cd8188" : "#f5f0e8",
                  color: fromMe ? "white" : "#65584f",
                }}
              >
                <SecureAppointmentMessageAttachment fromMe={fromMe} message={msg} />
                {!isGeneratedAttachmentBody(msg.body, msg.attachmentName) ? (
                  <p className="text-[14px] leading-[1.45]" style={{ fontFamily: M }}>{msg.body}</p>
                ) : null}
              </div>
              <p
                className={`text-[11px] mt-[4px] ${fromMe ? "text-right" : ""}`}
                style={{ color: "rgba(101,88,79,0.5)", fontFamily: M }}
              >
                {formatMessageTime(msg.createdAt)}
              </p>
            </div>
          </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="sticky bottom-[70px] bg-white border-t border-[#d6c8ad]/40">
        <form
          action={async (formData) => {
            const attachment = attachRef.current?.files?.[0];
            if (attachment) {
              formData.set("attachment", attachment);
            }
            await sendAppointmentMessageAction(formData);
            setDraft("");
            clearSelectedAttachment();
          }}
          className="flex items-center gap-[10px] px-[14px] py-[12px]"
          encType="multipart/form-data"
        >
          <input name="appointmentId" type="hidden" value={appointmentId} />
          <button
            type="button"
            onClick={() => attachRef.current?.click()}
            disabled={messagesUnavailable}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform disabled:opacity-55"
            style={{ background: "#d6c8ad" }}
            aria-label="Attach"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            ref={bodyRef}
            type="text"
            name="body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your message here"
            disabled={messagesUnavailable}
            className="flex-1 rounded-full px-[18px] py-[12px] text-[14px] outline-none"
            style={{ background: "#f5f0e8", color: "#65584f", fontFamily: M }}
          />
          <button
            aria-label="Send message"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full active:scale-95 disabled:opacity-55"
            style={{ background: "#cd8188" }}
            disabled={messagesUnavailable || (!draft.trim() && !selectedAttachment)}
            type="submit"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        {selectedAttachment ? (
          <DraftAttachmentPreview attachment={selectedAttachment} onRemove={clearSelectedAttachment} />
        ) : (
          <div className="grid grid-cols-2 gap-[8px] px-[14px] pb-[12px]">
            <button
              className="rounded-full px-[12px] py-[10px] text-[13px] font-bold active:scale-95 disabled:opacity-55"
              disabled={messagesUnavailable}
              onClick={() => setHelpOpen(true)}
              style={{ background: "#f5f0e8", color: "#65584f", fontFamily: M }}
              type="button"
            >
              SOS I need help
            </button>
            <button
              className="rounded-full px-[12px] py-[10px] text-[13px] font-bold text-white active:scale-95 disabled:opacity-55"
              disabled={messagesUnavailable}
              onClick={() => setReturnOpen(true)}
              style={{ background: "#cd8188", fontFamily: M }}
              type="button"
            >
              Return inquiry
            </button>
          </div>
        )}
      </div>

      {/* Return Inquiry modal */}
      {returnOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-[18px]"
          onClick={() => setReturnOpen(false)}
          style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <form
            action={submitReturnInquiryAction}
            role="dialog"
            aria-modal="true"
            aria-label={`Return inquiry for ${dogName}`}
            className="w-full max-w-[340px] rounded-[20px] bg-white px-[22px] py-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input name="appointmentId" type="hidden" value={appointmentId} />
            <p className="text-[21px] font-bold leading-[1.2] text-[#65584f]" style={{ fontFamily: M }}>
              Return inquiry for {dogName}
            </p>
            <p className="mt-[10px] text-[14px] leading-[1.5] text-[#65584f]/75" style={{ fontFamily: M }}>
              Share what is happening so the shelter and PawJai team can respond in this conversation.
            </p>
            <label className="mt-[18px] block text-[12px] font-bold uppercase tracking-[0.14em] text-[#65584f]/60" htmlFor="returnReason" style={{ fontFamily: M }}>
              Reason
            </label>
            <textarea
              className="mt-[8px] min-h-[118px] w-full rounded-[16px] border border-[#eadfce] bg-[#fffdfa] px-[14px] py-[12px] text-[14px] text-[#65584f] outline-none focus:border-[#cd8188]"
              id="returnReason"
              name="returnReason"
              placeholder="Tell us why you need to return"
              style={{ fontFamily: M }}
            />
            {shelter?.phone && (
              <a
                className="mt-[14px] flex w-full items-center justify-center rounded-full border border-[#eadfce] px-[14px] py-[11px] text-[13px] font-bold text-[#65584f] active:scale-95"
                href={`tel:${shelter.phone}`}
                style={{ fontFamily: M }}
              >
                Call shelter employee
              </a>
            )}
            <button
              className="mt-[14px] w-full rounded-full py-[13px] text-[15px] font-semibold text-white active:scale-95 transition-transform"
              style={{ background: "#cd8188", fontFamily: M }}
              type="submit"
            >
              Send return inquiry
            </button>
            <button
              type="button"
              onClick={() => setReturnOpen(false)}
              className="mt-[14px] w-full text-center text-[14px] text-[#65584f]/60 active:opacity-70"
              style={{ fontFamily: M }}
            >
              Not right now
            </button>
          </form>
        </div>
      )}

      {/* SOS help modal */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-[18px]"
          onClick={() => setHelpOpen(false)}
          style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="SOS I need help"
            className="w-full max-w-[340px] rounded-[20px] bg-white px-[22px] py-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[21px] font-bold leading-[1.2] text-[#65584f]" style={{ fontFamily: M }}>
              SOS I need help
            </p>
            <p className="mt-[10px] text-[14px] leading-[1.5] text-[#65584f]/75" style={{ fontFamily: M }}>
              Contact the shelter for urgent visit or adoption details, or reach PawJai for platform support.
            </p>
            {shelter?.phone ? (
              <a
                className="mt-[18px] flex w-full items-center justify-center rounded-full bg-[#65584f] px-[14px] py-[13px] text-[14px] font-bold text-white active:scale-95"
                href={`tel:${shelter.phone}`}
                style={{ fontFamily: M }}
              >
                Call shelter employee
              </a>
            ) : (
              <p className="mt-[18px] rounded-[14px] bg-[#f5f0e8] px-[14px] py-[12px] text-[13px] leading-[1.45] text-[#65584f]/75" style={{ fontFamily: M }}>
                This shelter has not added a phone number yet.
              </p>
            )}
            <a
              className="mt-[10px] flex w-full items-center justify-center rounded-full border border-[#eadfce] bg-[#fffdfa] px-[14px] py-[13px] text-[14px] font-bold text-[#65584f] active:scale-95"
              href="mailto:support@pawjaipet.com"
              style={{ fontFamily: M }}
            >
              Contact PawJai admin
            </a>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-[14px] w-full text-center text-[14px] text-[#65584f]/60 active:opacity-70"
              style={{ fontFamily: M }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpTab() {
  return (
    <div className="px-[16px] pt-[20px]">
      <div className="rounded-[14px] px-[20px] py-[24px]" style={{ background: "#f5f0e8" }}>
        <p className="text-[24px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Get help" />
        </p>
        <p className="mt-[6px] text-[14px] text-[#65584f]/65" style={{ fontFamily: M }}>
          <MachineTranslatedText text="Help center and contact support" />
        </p>
        <Link
          href="/more"
          className="mt-[18px] block w-full rounded-full py-[16px] text-center text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          <MachineTranslatedText text="Get help" />
        </Link>
      </div>
    </div>
  );
}
