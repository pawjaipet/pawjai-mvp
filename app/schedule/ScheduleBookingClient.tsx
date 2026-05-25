"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { bookAppointment } from "@/app/dogs/[id]/actions";
import type { MonthAvailability } from "@/utils/shelter-availability";

const M = "Montserrat, sans-serif";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ScheduleBookingClientProps = {
  availability: MonthAvailability;
  dog: {
    id: string;
    name: string;
  };
  shelter: {
    id: string;
    name: string;
  };
  viewMonth: number;
  viewYear: number;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function monthHref(dogId: string, year: number, month: number) {
  return `/schedule?dogId=${encodeURIComponent(dogId)}&month=${year}-${String(month + 1).padStart(2, "0")}`;
}

function getAdjacentMonth(year: number, month: number, direction: -1 | 1) {
  const next = new Date(year, month + direction, 1);
  return {
    month: next.getMonth(),
    year: next.getFullYear(),
  };
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function displayTime(time: string) {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return time;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute}`;
}

export default function ScheduleBookingClient({
  availability,
  dog,
  shelter,
  viewMonth,
  viewYear,
}: ScheduleBookingClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);
  const previousMonth = getAdjacentMonth(viewYear, viewMonth, -1);
  const nextMonth = getAdjacentMonth(viewYear, viewMonth, 1);
  const selectedAvailability = selectedDate ? availability.daysByDate[selectedDate] : null;
  const selectedSlots = selectedAvailability?.slots ?? [];
  const selectedMonthLabel = useMemo(() => {
    if (!selectedDate) return "";
    return `${Number(selectedDate.slice(-2))} ${MONTH_NAMES[viewMonth]}`;
  }, [selectedDate, viewMonth]);

  return (
    <div
      className="relative overflow-y-auto overflow-x-hidden"
      style={{
        width: "402px",
        maxWidth: "100vw",
        margin: "0 auto",
        minHeight: "100vh",
        paddingBottom: "90px",
        background: "#F5F1E8",
        scrollbarWidth: "none",
        fontFamily: M,
      }}
    >
      <style>{`div::-webkit-scrollbar{display:none}`}</style>

      <div className="px-[8px] pt-[7px] pb-[12px]">
        <Link href="/" className="relative block h-[80px] w-[80px] active:scale-95 transition-transform" aria-label="PawJai home">
          <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain object-left" priority />
        </Link>
      </div>

      <div className="px-[16px] pt-[100px]">
        <div className="mb-[4px] flex items-center gap-[10px]">
          <Link
            href={`/dogs/${dog.id}`}
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
            style={{ background: "#d6c8ad" }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-[24px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
            Book a Visit
          </h1>
        </div>
        <p className="mb-[24px] pl-[46px] text-[13px] text-[#65584f]/60" style={{ fontFamily: M }}>
          Meet <span className="font-semibold text-[#cd8188]">{dog.name}</span> at {shelter.name}
        </p>

        <div className="mb-[10px] flex items-center justify-center gap-[18px] text-[11px] font-semibold text-[#65584f]/65">
          <span className="flex items-center gap-[6px]">
            <span className="h-[10px] w-[10px] rounded-full bg-[#6b5d52]" />
            Unavailable
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="h-[10px] w-[10px] rounded-full bg-[#cd8188]" />
            Your Select
          </span>
        </div>

        <div className="mb-[20px] rounded-[20px] bg-white p-[16px]">
          <div className="mb-[16px] flex items-center justify-between">
            <Link
              href={monthHref(dog.id, previousMonth.year, previousMonth.month)}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: "#d6c8ad" }}
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="text-[16px] font-bold text-[#65584f]" style={{ fontFamily: M }}>
              {MONTH_NAMES[viewMonth]} {viewYear + 543} ({viewYear})
            </p>
            <Link
              href={monthHref(dog.id, nextMonth.year, nextMonth.month)}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: "#d6c8ad" }}
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="mb-[8px] grid grid-cols-7">
            {DAY_NAMES.map((dayName) => (
              <div key={dayName} className="py-[4px] text-center text-[11px] font-semibold text-[#65584f]/40" style={{ fontFamily: M }}>
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[4px]">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => {
              const dateKey = formatDateKey(viewYear, viewMonth, day);
              const dayAvailability = availability.daysByDate[dateKey];
              const selected = selectedDate === dateKey;
              const unavailable = !dayAvailability || dayAvailability.isUnavailable;
              const past = dayAvailability?.isPast ?? false;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={unavailable}
                  title={dayAvailability?.unavailableReason ?? undefined}
                  onClick={() => {
                    setSelectedDate(dateKey);
                    setSelectedTime(null);
                  }}
                  className="relative flex h-[42px] items-center justify-center rounded-[8px] transition-all active:scale-95 disabled:active:scale-100"
                  style={{
                    background: selected ? "#cd8188" : unavailable && !past ? "#6b5d52" : past ? "transparent" : "#d6c8ad",
                    color: selected ? "white" : unavailable && !past ? "white" : past ? "rgba(101,88,79,0.22)" : "#65584f",
                    cursor: unavailable ? "not-allowed" : "pointer",
                    fontFamily: M,
                    fontSize: 14,
                    fontWeight: selected || (!unavailable && day === new Date().getDate()) ? 700 : 500,
                    opacity: past ? 0.8 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="mb-[20px] rounded-[20px] bg-white p-[16px]">
            <p className="mb-[12px] text-[13px] font-semibold text-[#65584f]/60" style={{ fontFamily: M }}>
              Available times — {selectedMonthLabel}
            </p>
            {selectedSlots.length > 0 ? (
              <div className="flex flex-wrap gap-[8px]">
                {selectedSlots.map((slot) => {
                  const active = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className="rounded-full px-[16px] py-[8px] text-[13px] font-semibold transition-all active:scale-95"
                      style={{
                        background: active ? "#cd8188" : "#d6c8ad",
                        color: active ? "white" : "#65584f",
                        fontFamily: M,
                      }}
                    >
                      {displayTime(slot)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-[#65584f]/55">No visit times are available on this date.</p>
            )}
          </div>
        )}

        {selectedTime && (
          <div className="mb-[24px] rounded-[20px] bg-white p-[16px]">
            <label className="mb-[8px] block text-[12px] font-semibold uppercase tracking-wider text-[#65584f]/60" style={{ fontFamily: M }}>
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. I have a child aged 5. Does the dog get along with kids?"
              rows={3}
              className="w-full resize-none rounded-[12px] border-none px-[14px] py-[12px] text-[13px] text-[#65584f] outline-none"
              style={{ background: "#d6c8ad", fontFamily: M }}
            />
          </div>
        )}

        <form action={bookAppointment}>
          <input type="hidden" name="dogId" value={dog.id} />
          <input type="hidden" name="shelterId" value={shelter.id} />
          <input type="hidden" name="appointmentDate" value={selectedDate ?? ""} />
          <input type="hidden" name="appointmentTime" value={selectedTime ?? ""} />
          <input type="hidden" name="visitorNote" value={note} />
          <button
            disabled={!selectedDate || !selectedTime}
            className="w-full rounded-full py-[15px] text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "#cd8188", fontFamily: M }}
          >
            Confirm Visit
          </button>
        </form>
      </div>
    </div>
  );
}
