"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

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
  const [confirmed, setConfirmed]       = useState(false);

  const totalDays  = daysInMonth(viewYear, viewMonth);
  const firstDay   = firstDayOfMonth(viewYear, viewMonth);
  const todayDay   = today.getDate();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

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

  function handleConfirm() {
    // In production: call server action to create appointment
    setConfirmed(true);
  }

  if (confirmed && selectedDay && selectedTime) {
    const dateStr = `${selectedDay} ${MONTH_NAMES[viewMonth]} ${viewYear + 543} BE`;
    return (
      <div className="pt-[100px] px-[16px] flex flex-col items-center text-center">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-[24px]" style={{ background: "#cd8188" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-bold text-[28px] text-[#65584f] mb-[10px]" style={{ fontFamily: M }}>Visit Booked!</p>
        <p className="text-[14px] text-[#65584f]/70 mb-[28px] max-w-[280px]" style={{ fontFamily: M }}>
          Your visit to meet {dogName} at {shelter} has been confirmed.
        </p>
        <div className="w-full rounded-[16px] overflow-hidden mb-[24px]" style={{ border: "1px solid #65584f" }}>
          <div className="flex">
            <div className="w-[100px] shrink-0 flex flex-col items-center justify-center py-[16px]" style={{ background: "#65584f" }}>
              <p className="font-bold text-[48px] text-white leading-[1]" style={{ fontFamily: M }}>{selectedDay}</p>
              <p className="text-[14px] text-white/90 mt-[4px]" style={{ fontFamily: M }}>{MONTH_NAMES[viewMonth]}</p>
              <p className="text-[14px] text-white/90" style={{ fontFamily: M }}>{viewYear + 543} BE</p>
            </div>
            <div className="flex-1 p-[16px]">
              <p className="text-[13px] text-[#65584f]/80 mb-[4px]" style={{ fontFamily: M }}>{shelter}</p>
              <p className="text-[15px] font-bold text-[#65584f] mb-[8px]" style={{ fontFamily: M }}>{selectedTime}</p>
              {note && <p className="text-[11px] text-[#65584f]/60 italic" style={{ fontFamily: M }}>"{note}"</p>}
            </div>
          </div>
          <div className="px-[16px] py-[10px] flex items-center justify-between" style={{ background: "#cd8188" }}>
            <p className="text-[13px] font-semibold text-white" style={{ fontFamily: M }}>{dogName}</p>
            <span className="rounded-full px-[10px] py-[3px] text-[11px] font-semibold bg-white text-[#cd8188]" style={{ fontFamily: M }}>pending</span>
          </div>
        </div>
        <Link
          href="/appointments"
          className="w-full rounded-full py-[15px] text-white font-bold text-[16px] text-center block active:scale-[0.98] transition-transform"
          style={{ background: "#cd8188", fontFamily: M }}
        >
          View My Appointments
        </Link>
        <Link href="/swipe" className="mt-[12px] text-[14px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>
          Back to browsing
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-[100px] px-[16px]">
      {/* Back */}
      <div className="flex items-center gap-[10px] mb-[4px]">
        <Link href={dogId ? `/dogs/${dogId}` : "/swipe"} className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0" style={{ background: "#d6c8ad" }}>
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
      <button
        disabled={!selectedDay || !selectedTime}
        onClick={handleConfirm}
        className="w-full rounded-full py-[15px] text-white font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: "#cd8188", fontFamily: M }}
      >
        Confirm Visit
      </button>
    </div>
  );
}

export default function SchedulePage() {
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

      <Suspense fallback={<div className="pt-[120px] px-[16px] text-[#65584f]/40 text-center" style={{ fontFamily: M }}>Loading...</div>}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
