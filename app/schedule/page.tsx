"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { bookAppointment } from "@/app/dogs/[id]/actions";
import ClientAuthGate from "@/components/auth/ClientAuthGate";

const M = "Montserrat, sans-serif";

const TIME_SLOTS = [
  { label: "09:00", period: "Morning" },
  { label: "10:00", period: "Morning" },
  { label: "11:00", period: "Morning" },
  { label: "13:00", period: "Afternoon" },
  { label: "14:00", period: "Afternoon" },
  { label: "15:00", period: "Afternoon" },
  { label: "16:00", period: "Afternoon" },
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function ScheduleContent() {
  const params = useSearchParams();
  const dogName  = params.get("dog")     ?? "your dog";
  const shelter  = params.get("shelter") ?? "the shelter";
  const dogId    = params.get("dogId")   ?? "";
  const shelterId = params.get("shelterId") ?? "";

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote]                 = useState("");

  const totalDays  = daysInMonth(viewYear, viewMonth);
  const firstDay   = firstDayOfMonth(viewYear, viewMonth);
  const todayDay   = today.getDate();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const nextPath = `/schedule?${params.toString()}`;
  const appointmentDate = selectedDay
    ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : "";

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null); setSelectedTime(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null); setSelectedTime(null);
  }

  function isPast(day: number) {
    if (!isCurrentMonth) return false;
    return day < todayDay;
  }

  return (
    <ClientAuthGate
      nextPath={nextPath}
      reason="Sign in to book and save shelter visits."
    >
    <div className="pt-[100px] px-[16px]">
      {/* Back */}
      <div className="flex items-center gap-[10px] mb-[4px]">
        <Link href={dogId ? `/dogs/${dogId}` : "/"} className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0" style={{ background: "#d6c8ad" }}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-bold text-[24px] text-[#65584f]" style={{ fontFamily: M }}>Book a Visit</h1>
      </div>
      <p className="text-[13px] text-[#65584f]/60 mb-[24px] pl-[46px]" style={{ fontFamily: M }}>
        Meet <span className="font-semibold text-[#cd8188]">{dogName}</span> at {shelter}
      </p>

      {/* Calendar */}
      <div className="rounded-[20px] p-[16px] mb-[20px]" style={{ background: "white" }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-[16px]">
          <button onClick={prevMonth} className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95" style={{ background: "#d6c8ad" }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <p className="font-bold text-[16px] text-[#65584f]" style={{ fontFamily: M }}>{MONTH_NAMES[viewMonth]} {viewYear}</p>
          <button onClick={nextMonth} className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95" style={{ background: "#d6c8ad" }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1L7 7L1 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-[8px]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-[#65584f]/40 py-[4px]" style={{ fontFamily: M }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-[4px]">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const past     = isPast(day);
            const selected = selectedDay === day;
            const isTodayDay = isCurrentMonth && day === todayDay;
            return (
              <button
                key={day}
                disabled={past}
                onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                className="relative flex flex-col items-center justify-center h-[40px] rounded-full transition-all active:scale-95"
                style={{
                  background: selected ? "#cd8188" : "transparent",
                  color: selected ? "white" : past ? "rgba(101,88,79,0.25)" : "#65584f",
                  fontFamily: M,
                  fontWeight: selected || isTodayDay ? 700 : 400,
                  fontSize: 14,
                }}
              >
                {day}
                {isTodayDay && !selected && (
                  <span className="absolute bottom-[4px] w-[4px] h-[4px] rounded-full" style={{ background: "#cd8188" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDay && (
        <div className="rounded-[20px] p-[16px] mb-[20px]" style={{ background: "white" }}>
          <p className="font-semibold text-[13px] text-[#65584f]/60 mb-[12px]" style={{ fontFamily: M }}>
            Available times — {selectedDay} {MONTH_NAMES[viewMonth]}
          </p>
          <div className="flex flex-wrap gap-[8px]">
            {TIME_SLOTS.map((slot) => {
              const active = selectedTime === slot.label;
              return (
                <button
                  key={slot.label}
                  onClick={() => setSelectedTime(slot.label)}
                  className="rounded-full px-[16px] py-[8px] text-[13px] font-semibold transition-all active:scale-95"
                  style={{
                    background: active ? "#cd8188" : "#d6c8ad",
                    color: active ? "white" : "#65584f",
                    fontFamily: M,
                  }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      {selectedTime && (
        <div className="rounded-[20px] p-[16px] mb-[24px]" style={{ background: "white" }}>
          <label className="block text-[12px] font-semibold text-[#65584f]/60 mb-[8px] uppercase tracking-wider" style={{ fontFamily: M }}>
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. I have a child aged 5. Does the dog get along with kids?"
            rows={3}
            className="w-full rounded-[12px] px-[14px] py-[12px] text-[13px] text-[#65584f] outline-none border-none resize-none"
            style={{ background: "#d6c8ad", fontFamily: M }}
          />
        </div>
      )}

      {/* CTA */}
      <form action={bookAppointment}>
        <input type="hidden" name="dogId" value={dogId} />
        <input type="hidden" name="shelterId" value={shelterId} />
        <input type="hidden" name="appointmentDate" value={appointmentDate} />
        <input type="hidden" name="appointmentTime" value={selectedTime ?? ""} />
        <input type="hidden" name="visitorNote" value={note} />
        <button
          disabled={!selectedDay || !selectedTime || !dogId}
          className="w-full rounded-full py-[15px] text-white font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          Confirm Visit
        </button>
      </form>
    </div>
    </ClientAuthGate>
  );
}

export default function SchedulePage() {
  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", minHeight: "100vh", paddingBottom: "90px", background: "#F5F1E8", scrollbarWidth: "none", fontFamily: M }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      {/* Inline header with logo */}
      <div className="px-[8px] pt-[7px] pb-[12px]">
        <Link href="/" className="block h-[80px] w-[80px] relative active:scale-95 transition-transform" aria-label="PawJai home">
          <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
        </Link>
      </div>

      <Suspense fallback={<div className="px-[16px] text-[#65584f]/40 text-center" style={{ fontFamily: M }}>Loading...</div>}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
