"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { acceptRescheduleRequestAction, cancelAppointmentFromListAction } from "@/app/appointments/actions";
import { cancelAppointmentAction, sendAppointmentMessageAction } from "@/app/appointments/[id]/actions";

const M = "Montserrat, sans-serif";

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
    breed: string | null;
    coverUrl: string | null;
  } | null;
  shelter: {
    name: string;
    nameTh: string | null;
    phone: string | null;
    email: string | null;
    addressLines: string[];
    googleMapsUrl: string | null;
    latitude: number | null;
    logoUrl: string | null;
    longitude: number | null;
    meetingInstructions: string | null;
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
  body: string;
  createdAt: string;
  id: string;
  senderLabel: string | null;
  senderRole: "adopter" | "shelter" | "system";
};

export default function AppointmentDetailClient({
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
        <Link
          href="/"
          className="block h-[52px] w-[52px] mb-[12px] active:scale-95 transition-transform"
          aria-label="PawJai home"
          style={{ filter: "brightness(0) invert(1)" }}
        >
          <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
        </Link>

        <div className="flex items-center gap-[12px]">
          <div className="w-[48px] h-[48px] rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            {dog?.coverUrl ? (
              <img src={dog.coverUrl} alt={dog.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-white truncate" style={{ fontFamily: M }}>Appointment</p>
            <p className="text-[13px] text-white/75 truncate" style={{ fontFamily: M }}>{dog?.name ?? "Visit"}</p>
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
              {label}
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
          appointmentId={appointmentId}
          dogName={dog?.name ?? "the shelter"}
          initialMessages={initialMessages}
          messagesUnavailable={messagesUnavailable}
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
  return (
    <div className="px-[18px] pt-[24px] pb-[40px] space-y-[28px]">
      {/* Time range */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: M }}>
            {time.weekday}, {time.monthDay}
          </p>
          <p className="font-bold text-[28px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>
            {time.start || "—"}
          </p>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <div className="text-right">
          <p className="text-[14px] text-[#65584f]/60" style={{ fontFamily: M }}>
            {time.weekday}, {time.monthDay}
          </p>
          <p className="font-bold text-[28px] text-[#65584f] leading-[1.1]" style={{ fontFamily: M }}>
            {time.end || "—"}
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
            MEETING AT
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
            {shelter.addressLines.length > 0 && (
              <p className="text-[14px] text-[#65584f] mt-[8px] leading-[1.45]" style={{ fontFamily: M }}>
                {shelter.addressLines.join(", ")}
              </p>
            )}
            {shelter.meetingInstructions && (
              <p className="text-[13px] text-[#65584f]/70 mt-[8px] leading-[1.45]" style={{ fontFamily: M }}>
                {shelter.meetingInstructions}
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
                Click to access Google Maps
              </a>
            )}
          </div>
        </section>
      )}

      {/* Dog information */}
      {dog && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
            DOG INFORMATION
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
              <p className="text-[18px] font-bold text-[#65584f] truncate" style={{ fontFamily: M }}>{dog.name}</p>
              {dog.breed && (
                <p className="text-[14px] text-[#65584f]/65 truncate" style={{ fontFamily: M }}>{dog.breed}</p>
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
            SHELTER CONTACT
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
          CHECK-IN QR CODE
        </p>
        <div className="rounded-[14px] p-[24px] flex flex-col items-center" style={{ border: "1.5px solid rgba(101,88,79,0.18)" }}>
          <div
            className="w-[184px] h-[184px] [&_svg]:h-full [&_svg]:w-full"
            aria-label={`Check-in QR code for ${bookingId}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <p className="mt-[20px] text-[11px] tracking-[0.16em] font-semibold text-[#65584f]/55" style={{ fontFamily: M }}>
            BOOKING ID
          </p>
          <p className="mt-[2px] text-[22px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
            {bookingId}
          </p>

          <div className="mt-[18px] w-full rounded-[10px] px-[16px] py-[12px]" style={{ background: "#f5f0e8" }}>
            <p className="text-[13px] text-[#65584f]/65" style={{ fontFamily: M }}>
              {time.weekday}, {time.monthDay}
            </p>
            <p className="font-bold text-[20px] text-[#65584f]" style={{ fontFamily: M }}>
              {time.start || "—"}
            </p>
          </div>

          <p className="mt-[14px] text-[13px] text-[#65584f]/55 text-center" style={{ fontFamily: M }}>
            Show this QR code at the shelter entrance
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
        Cancel Appointment
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
            <p className="text-[20px] font-bold text-[#65584f]" style={{ fontFamily: M }}>Cancel this appointment?</p>
            <p className="mt-[10px] text-[14px] leading-[1.55] text-[#65584f]/70" style={{ fontFamily: M }}>
              The shelter will be notified. You can book another time anytime.
            </p>
            <div className="mt-[20px] flex gap-[10px]">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="h-[48px] flex-1 rounded-[14px] text-[14px] font-bold disabled:opacity-60"
                style={{ background: "rgba(101,88,79,0.1)", color: "#65584f", fontFamily: M }}
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] text-[14px] font-bold text-white disabled:opacity-60"
                style={{ background: "#b3565e", fontFamily: M }}
              >
                {isPending ? "Cancelling..." : "Yes, cancel"}
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
        DATE CHANGE REQUEST
      </p>
      <p className="mt-[8px] text-[18px] font-bold leading-[1.35] text-[#65584f]" style={{ fontFamily: M }}>
        {dateLabel} at {timeLabel}
      </p>
      {note ? (
        <p className="mt-[6px] text-[13px] leading-[1.5] text-[#65584f]/70" style={{ fontFamily: M }}>
          {note}
        </p>
      ) : null}
      <div className="mt-[14px] grid grid-cols-3 gap-[8px]">
        <form action={acceptRescheduleRequestAction}>
          <input name="appointmentId" type="hidden" value={appointmentId} />
          <button className="h-[42px] w-full rounded-full bg-[#3f7d34] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
            Accept
          </button>
        </form>
        <Link
          className="flex h-[42px] items-center justify-center rounded-full border border-[#eadfce] bg-white px-[10px] text-center text-[12px] font-bold text-[#65584f]"
          href={`/appointments?edit=${appointmentId}`}
          style={{ fontFamily: M }}
        >
          Different
        </Link>
        <form action={cancelAppointmentFromListAction}>
          <input name="appointmentId" type="hidden" value={appointmentId} />
          <button className="h-[42px] w-full rounded-full bg-[#c46f75] px-[10px] text-[12px] font-bold text-white active:scale-[0.98]" style={{ fontFamily: M }} type="submit">
            Cancel
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
        <p className="text-[15px] font-bold leading-[1.1]" style={{ color: c.fg }}>{c.label}</p>
        <p className="text-[13px] mt-[2px] leading-[1.35]" style={{ color: c.fg, opacity: 0.78 }}>{c.explain}</p>
      </div>
    </div>
  );
}

function MessagesTab({
  appointmentId,
  dogName,
  initialMessages,
  messagesUnavailable,
}: {
  appointmentId: string;
  dogName: string;
  initialMessages: AppointmentThreadMessage[];
  messagesUnavailable: boolean;
}) {
  const attachRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<AppointmentThreadMessage[]>([]);
  const chatMessages = [
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
    ...localAttachments,
  ];

  function handleAttachment(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const now = new Date();
    setLocalAttachments((prev) => [
      ...prev,
      {
        body: file.type.startsWith("image/")
          ? `[Image ready to send later: ${file.name}]`
          : `[Attachment ready to send later: ${file.name}]`,
        createdAt: now.toISOString(),
        id: `local-${now.getTime()}`,
        senderLabel: "You",
        senderRole: "adopter",
      },
    ]);
    if (attachRef.current) attachRef.current.value = "";
  }

  function formatMessageTime(value: string) {
    return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 240px)" }}>
      {/* Hidden file input — single native picker (#4) */}
      <input
        ref={attachRef}
        type="file"
        accept="image/*,video/*,application/pdf"
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
                <p className="text-[14px] leading-[1.45]" style={{ fontFamily: M }}>{msg.body}</p>
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
      <form action={sendAppointmentMessageAction} className="sticky bottom-[70px] flex items-center gap-[10px] px-[14px] py-[12px] bg-white border-t border-[#d6c8ad]/40">
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
          type="text"
          name="body"
          placeholder="Write your message here"
          disabled={messagesUnavailable}
          className="flex-1 rounded-full px-[18px] py-[12px] text-[14px] outline-none"
          style={{ background: "#f5f0e8", color: "#65584f", fontFamily: M }}
        />
        <button
          aria-label="Send message"
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full active:scale-95 disabled:opacity-55"
          style={{ background: "#cd8188" }}
          disabled={messagesUnavailable}
          type="submit"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function HelpTab() {
  return (
    <div className="px-[16px] pt-[20px]">
      <div className="rounded-[14px] px-[20px] py-[24px]" style={{ background: "#f5f0e8" }}>
        <p className="text-[24px] font-bold text-[#65584f]" style={{ fontFamily: M }}>Get help</p>
        <p className="mt-[6px] text-[14px] text-[#65584f]/65" style={{ fontFamily: M }}>
          Help center and contact support
        </p>
        <Link
          href="/more"
          className="mt-[18px] block w-full rounded-full py-[16px] text-center text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          Get help
        </Link>
      </div>
    </div>
  );
}
