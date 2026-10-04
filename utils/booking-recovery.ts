import type { MonthAvailability } from "@/utils/shelter-availability";

export type BookingSlotConflict = {
  status: "slot_unavailable";
  reason: "slot_unavailable" | "slot_taken";
  availability: MonthAvailability;
};

export function bookingSlotConflictReason(
  availableSlots: string[],
  requestedTime: string,
  alreadyBooked = false,
): BookingSlotConflict["reason"] | null {
  if (!availableSlots.includes(requestedTime)) return "slot_unavailable";
  if (alreadyBooked) return "slot_taken";
  return null;
}

export function isBookingSlotUniqueConflict(message: string) {
  return message.includes("appointments_active_slot_unique_idx");
}

export function recoverBookingSlot(
  selectedDate: string,
  note: string,
  conflict: BookingSlotConflict,
) {
  const remainingTimes = conflict.availability.daysByDate[selectedDate]?.slots ?? [];
  return {
    availability: conflict.availability,
    note,
    selectedDate,
    selectedTime: null,
    hasRemainingTimes: remainingTimes.length > 0,
  };
}

export function createBookingSubmissionGuard() {
  let pending = false;
  return {
    claim() {
      if (pending) return false;
      pending = true;
      return true;
    },
    release() {
      pending = false;
    },
  };
}
