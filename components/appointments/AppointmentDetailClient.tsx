"use client";

import { useState } from "react";
import Link from "next/link";

const M = "Montserrat, sans-serif";

type Tab = "details" | "messages" | "help";

interface Props {
  appointmentId: string;
  bookingId: string;
  dog: {
    id: string;
    name: string;
    breed: string | null;
    coverUrl: string | null;
  } | null;
  shelter: {
    name: string;
    phone: string | null;
    email: string | null;
    addressLines: string[];
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

export default function AppointmentDetailClient({
  bookingId,
  dog,
  shelter,
  time,
}: Props) {
  const [tab, setTab] = useState<Tab>("details");

  const mapsHref = shelter && shelter.addressLines.length > 0
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.addressLines.join(", "))}`
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
      {/* ── Dark brown app bar ── */}
      <div
        className="px-[16px] pt-[14px] pb-[14px] relative"
        style={{ background: "#65584f" }}
      >
        {/* Paw icon top-left */}
        <div className="absolute top-[8px] left-[10px]">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="#cd8188">
            <ellipse cx="50" cy="75" rx="22" ry="18" />
            <ellipse cx="20" cy="55" rx="10" ry="13" />
            <ellipse cx="80" cy="55" rx="10" ry="13" />
            <ellipse cx="35" cy="40" rx="9" ry="11" />
            <ellipse cx="65" cy="40" rx="9" ry="11" />
          </svg>
        </div>

        <div className="flex items-center gap-[12px] mt-[18px]">
          <Link
            href="/appointments"
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" />
            </svg>
          </Link>

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

          <button
            type="button"
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Share"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 8l5-5 5 5M5 21h14a2 2 0 0 0 2-2v-7" />
            </svg>
          </button>
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
          bookingId={bookingId}
          dog={dog}
          shelter={shelter}
          time={time}
          mapsHref={mapsHref}
        />
      )}

      {tab === "messages" && (
        <MessagesTab dogName={dog?.name ?? "the shelter"} />
      )}

      {tab === "help" && <HelpTab />}
    </div>
  );
}

function DetailsTab({
  bookingId,
  dog,
  shelter,
  time,
  mapsHref,
}: {
  bookingId: string;
  dog: Props["dog"];
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

      {/* Meeting at */}
      {shelter && (
        <section>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#65584f]/65 mb-[10px]" style={{ fontFamily: M }}>
            MEETING AT
          </p>
          <div className="rounded-[14px] p-[18px]" style={{ background: "#f5f0e8" }}>
            <p className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>{shelter.name}</p>
            {shelter.addressLines.map((line, i) => (
              <p key={i} className="text-[14px] text-[#65584f] mt-[4px] leading-[1.45]" style={{ fontFamily: M }}>
                {line}
              </p>
            ))}
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
            <p className="text-[18px] font-bold text-[#65584f]" style={{ fontFamily: M }}>{shelter.name}</p>
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
          {/* Decorative QR pattern */}
          <div className="w-[180px] h-[180px] grid grid-cols-12 grid-rows-12 gap-[2px]">
            {Array.from({ length: 144 }).map((_, i) => {
              // Deterministic pseudo-pattern from bookingId
              const seed = (bookingId.charCodeAt((i * 7) % bookingId.length) + i * 13) % 5;
              const filled = seed < 3;
              // Three corner finder squares
              const row = Math.floor(i / 12);
              const col = i % 12;
              const inCorner = (row < 3 && col < 3) || (row < 3 && col > 8) || (row > 8 && col < 3);
              if (inCorner) {
                const cornerRow = row > 8 ? row - 9 : row;
                const cornerCol = col > 8 ? col - 9 : col;
                const cornerFilled =
                  cornerRow === 0 || cornerRow === 2 || cornerCol === 0 || cornerCol === 2 ||
                  (cornerRow === 1 && cornerCol === 1);
                return (
                  <div
                    key={i}
                    style={{ background: cornerFilled ? "#65584f" : "transparent" }}
                  />
                );
              }
              return (
                <div
                  key={i}
                  style={{ background: filled ? "#65584f" : "transparent" }}
                />
              );
            })}
          </div>

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
    </div>
  );
}

function MessagesTab({ dogName }: { dogName: string }) {
  const [draft, setDraft] = useState("");

  // Static demo conversation while real chat backend is wired
  const messages = [
    {
      from: "shelter",
      text: `Hello! Thank you for booking an appointment to meet ${dogName}. We're excited to introduce you!`,
      time: "3:00 AM",
      day: "TUESDAY, APR 7, 2026",
    },
    {
      from: "me",
      text: "Thank you! I'm really looking forward to meeting them. What should I bring?",
      time: "3:15 AM",
      read: true,
    },
    {
      from: "shelter",
      text: `Please bring your ID and any questions you may have. We'll show you around and introduce you to ${dogName}.`,
      time: "7:30 AM",
    },
  ];

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 240px)" }}>
      <div className="flex-1 px-[16px] py-[20px] space-y-[16px] overflow-y-auto">
        <p className="text-center text-[11px] font-semibold tracking-[0.14em] text-[#65584f]/45" style={{ fontFamily: M }}>
          TUESDAY, APR 7, 2026
        </p>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[78%]">
              <div
                className="rounded-[18px] px-[16px] py-[12px]"
                style={{
                  background: msg.from === "me" ? "#cd8188" : "#f5f0e8",
                  color: msg.from === "me" ? "white" : "#65584f",
                }}
              >
                <p className="text-[14px] leading-[1.45]" style={{ fontFamily: M }}>{msg.text}</p>
              </div>
              <p
                className={`text-[11px] mt-[4px] ${msg.from === "me" ? "text-right" : ""}`}
                style={{ color: "rgba(101,88,79,0.5)", fontFamily: M }}
              >
                {msg.time}{msg.from === "me" && msg.read ? "  ·  Read" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="sticky bottom-[70px] flex items-center gap-[10px] px-[14px] py-[12px] bg-white border-t border-[#d6c8ad]/40">
        <button
          type="button"
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write your message here"
          className="flex-1 rounded-full px-[18px] py-[12px] text-[14px] outline-none"
          style={{ background: "#f5f0e8", color: "#65584f", fontFamily: M }}
        />
      </div>
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
